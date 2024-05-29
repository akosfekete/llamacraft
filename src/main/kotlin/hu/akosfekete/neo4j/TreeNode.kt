package hu.akosfekete.neo4j

import org.neo4j.graphdb.Relationship

data class GraphNode(val id: String, val label: String)
data class GraphEdge(val id: String, val label: String, val source: String, val target: String) {
    companion object {
        fun fromRelationship(rel: Relationship): GraphEdge {
            val startTitle = rel.startNode.getProperty("title") as String
            val endTitle = rel.endNode.getProperty("title") as String
            return GraphEdge("$startTitle->$endTitle", rel.getProperty(PROP_OTHER_NODE) as String, startTitle, endTitle)
        }
    }
}

data class Graph(val nodes: Set<GraphNode>, val edges: Set<GraphEdge>) {
    companion object {
        fun empty(): Graph = Graph(emptySet(), emptySet())
    }
}