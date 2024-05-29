package hu.akosfekete.neo4j

import jakarta.annotation.PostConstruct
import jakarta.annotation.PreDestroy
import jakarta.enterprise.context.ApplicationScoped
import org.neo4j.configuration.GraphDatabaseSettings.DEFAULT_DATABASE_NAME
import org.neo4j.dbms.api.DatabaseManagementService
import org.neo4j.dbms.api.DatabaseManagementServiceBuilder
import org.neo4j.graphdb.Direction
import org.neo4j.graphdb.GraphDatabaseService
import org.neo4j.graphdb.Node
import org.neo4j.graphdb.Transaction
import org.neo4j.kernel.impl.core.NodeEntity
import java.nio.file.Path
import kotlin.io.path.exists

private const val TEST_DB_NAME = "test_db_name"

const val PROP_OTHER_NODE = "firstNodeProperty"

@ApplicationScoped
class Neo4jDb {
    private lateinit var managementService: DatabaseManagementService
    private lateinit var graphDb: GraphDatabaseService

    @PostConstruct
    fun initDb() {
        val of = Path.of("neo4j_test")
        managementService = DatabaseManagementServiceBuilder(of).build()
        if (!of.exists()) {
            managementService.createDatabase(TEST_DB_NAME)
        }
        graphDb = managementService.database(DEFAULT_DATABASE_NAME)
    }

    @PreDestroy
    fun shutdownDb() = managementService.shutdown()

    fun saveCombinationResult(first: String, second: String, resultString: String?) {
        if (resultString == null) {
            return;
        }
        graphDb.beginTx().use {
            val i = first.compareTo(second)
            val firstNode = createOrFindNode(if (i < 0) first else second, it)
            val secondNode = createOrFindNode(if (i < 0) second else first, it)
            val resultNode = createOrFindNode(resultString, it)

            val fromFirstNode = firstNode.createRelationshipTo(resultNode, COMBINATION_RESULT)
            val fromSecondNode = secondNode.createRelationshipTo(resultNode, COMBINATION_RESULT)
            fromSecondNode.setProperty(PROP_OTHER_NODE, firstNode.getProperty("title"))
            fromFirstNode.setProperty(PROP_OTHER_NODE, secondNode.getProperty("title"))

            it.commit()
        }
    }

    private fun createOrFindNode(title: String, tx: Transaction) = findNode(title, tx) ?: createNode(title, tx)

    private fun createNode(title: String, tx: Transaction): Node {
        val createNode = tx.createNode()
        createNode.setProperty("title", title)
        return createNode
    }

    fun getCombinationResult(first: String, second: String): String? {
        graphDb.beginTx().use { tx ->
            val i = first.compareTo(second)
            val firstNode = findNode(if (i < 0) first else second, tx)
            val secondNode = findNode(if (i < 0) second else first, tx)
            val found = secondNode?.getRelationships(COMBINATION_RESULT)
                    ?.firstOrNull { it.getProperty(PROP_OTHER_NODE) == firstNode?.getProperty("title") }
            return found?.endNode?.getProperty("title") as String?
        }
    }

    fun getAllResults(): Collection<String> {
        graphDb.beginTx().use { tx ->
            val res = tx.execute("MATCH (n) RETURN n")
            return res.stream().map { it["n"] as Node }.map { it.getProperty("title") as String }.toList()
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

    fun clear() {
        graphDb.beginTx().use  { tx ->
            tx.execute("MATCH (n) DETACH DELETE n")
            tx.commit()
         }
    }

}