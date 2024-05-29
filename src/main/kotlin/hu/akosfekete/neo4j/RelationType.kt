package hu.akosfekete.neo4j

import org.neo4j.graphdb.RelationshipType

val COMBINES_WITH = RelationType("combines_with")
val COMBINATION_RESULT = RelationType("combination_result")

class RelationType(private val name: String) : RelationshipType {

    override fun name(): String {
        return name
    }

}