package hu.akosfekete.neo4j

import jakarta.annotation.PostConstruct
import jakarta.annotation.PreDestroy
import jakarta.enterprise.context.ApplicationScoped
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.neo4j.configuration.GraphDatabaseSettings.DEFAULT_DATABASE_NAME
import org.neo4j.dbms.api.DatabaseManagementService
import org.neo4j.dbms.api.DatabaseManagementServiceBuilder
import org.neo4j.graphdb.Direction
import org.neo4j.graphdb.GraphDatabaseService
import org.neo4j.graphdb.Node
import org.neo4j.graphdb.Transaction
import org.neo4j.kernel.impl.core.NodeEntity
import java.nio.file.Path
import java.time.Instant
import kotlin.io.path.exists

const val PROP_OTHER_NODE = "firstNodeProperty"
val defValues = listOf("Earth", "Fire", "Wind", "Water")

@ApplicationScoped
class Neo4jDb {
    private lateinit var managementService: DatabaseManagementService
    private lateinit var graphDb: GraphDatabaseService

    @ConfigProperty(name = "neo4j.path", defaultValue = "neo4j_test")
    lateinit var neo4jPath: String

    @PostConstruct
    fun initDb() {
        val of = Path.of(neo4jPath)
        require(of.exists()) { "DB path incorrect: $neo4jPath" }
        managementService = DatabaseManagementServiceBuilder(of).build()
        graphDb = managementService.database(DEFAULT_DATABASE_NAME)
        initDbWithDefValues()
    }

    fun initDbWithDefValues() {
        graphDb.beginTx().use { tx ->
            defValues.forEach {
                createOrFindNode(it, "", tx)
            }
            tx.commit()
        }
    }

    @PreDestroy
    fun shutdownDb() = managementService.shutdown()

    fun saveCombinationResult(first: String, second: String, resultString: String?, emoji: String): String? {
        if (resultString == null) {
            return null
        }
        graphDb.beginTx().use {
            val i = first.compareTo(second)
            val firstNode = createOrFindNode(if (i < 0) first else second, it)
            val secondNode = createOrFindNode(if (i < 0) second else first, it)
            val resultNode = createOrFindNode(resultString, emoji, it)

            val fromFirstNode = firstNode.createRelationshipTo(resultNode, COMBINATION_RESULT)
            val fromSecondNode = secondNode.createRelationshipTo(resultNode, COMBINATION_RESULT)
            fromSecondNode.setProperty(PROP_OTHER_NODE, firstNode.getProperty("title"))
            fromFirstNode.setProperty(PROP_OTHER_NODE, secondNode.getProperty("title"))

            val result = "${resultNode.getProperty("title")} ${resultNode.getProperty("emoji")}"
            it.commit()
            return result
        }
    }

    private fun createOrFindNode(title: String, emoji: String, tx: Transaction) = findNode(title, tx) ?: createNode(title, emoji, tx)

    // TODO: handle this better, no need to create nodes when finding preexisting nodes
    private fun createOrFindNode(title: String, tx: Transaction) = findNode(title, tx) ?: createNode(title, "", tx)

    private fun createNode(title: String, emoji: String, tx: Transaction): Node {
        val createNode = tx.createNode()
        createNode.setProperty("title", title)
        createNode.setProperty("emoji", emoji)
        createNode.setProperty("creationTime", Instant.now().toEpochMilli())
        return createNode
    }

    fun getCombinationResult(first: String, second: String): String? {
        graphDb.beginTx().use { tx ->
            val i = first.compareTo(second)
            val firstNode = findNode(if (i < 0) first else second, tx)
            val secondNode = findNode(if (i < 0) second else first, tx)
            val found = secondNode?.getRelationships(COMBINATION_RESULT)
                ?.firstOrNull { it.getProperty(PROP_OTHER_NODE) == firstNode?.getProperty("title") }
            if (found == null) {
                return null
            }
            return "${found.endNode?.getProperty("title")} ${found.endNode?.getProperty("emoji")}"
        }
    }

    fun getAllResults(): Collection<String> {
        graphDb.beginTx().use { tx ->
            val res = tx.execute("MATCH (n) RETURN n ORDER BY n.creationTime")
            return res.stream().map { it["n"] as Node }.map { "${it.getProperty("title")} ${it.getProperty("emoji")}" }.toList()
        }
    }

    fun getHierarchy(startNodeTitle: String): Graph {
        graphDb.beginTx().use { tx ->
            val startNode = findNode(startNodeTitle, tx) ?: return Graph.empty()
            val traversalDesc = tx.traversalDescription()
                .breadthFirst()
                .relationships(COMBINATION_RESULT, Direction.INCOMING)
            val traverser = traversalDesc.traverse(startNode)
            val nodes = traverser.nodes().map { GraphNode(it.getProperty("title") as String, it.getProperty("title") as String) }.toSet()
            val edges = traverser.relationships().map { GraphEdge.fromRelationship(it) }.toSet()
            return Graph(nodes, edges)
        }
    }

    private fun findNode(title: String, tx: Transaction): NodeEntity? {
        val res = tx.execute("MATCH (n {title: \$title}) RETURN n, n.title", mapOf("title" to title))
        if (!res.hasNext()) {
            return null
        }
        val next = res.next()
        return next["n"] as NodeEntity
    }

    fun getEmojiForNode(title: String): String? {
        graphDb.beginTx().use { tx ->
            return findNode(title, tx)?.getProperty("emoji") as String?
        }
    }

    fun clear() {
        graphDb.beginTx().use { tx ->
            tx.execute("MATCH (n) DETACH DELETE n")
            tx.commit()
        }
        initDbWithDefValues()
    }

}