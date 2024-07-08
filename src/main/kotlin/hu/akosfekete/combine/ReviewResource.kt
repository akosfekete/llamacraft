package hu.akosfekete.combine

import hu.akosfekete.db.FileDB
import hu.akosfekete.db.defValues
import hu.akosfekete.neo4j.Neo4jDb
import jakarta.enterprise.inject.Default
import jakarta.inject.Inject
import jakarta.ws.rs.*
import jakarta.ws.rs.core.Response


@Path("/review")
class ReviewResource {
    @Inject
    lateinit var triage: CombineAgent

    @Inject
    lateinit var emojiAgent: EmojiAgent

    @Inject
    @field: Default
    lateinit var fileDB: FileDB

    @Inject
    @field: Default
    lateinit var graphDb: Neo4jDb

    @GET
    @Path("/combine/")
    fun combineWords(@QueryParam("first") first: String, @QueryParam("second") second: String): String {
//        val combinationResult = fileDB.getCombinationResult(first, second)
        val graphResult = graphDb.getCombinationResult(first, second)
        if (graphResult == null) {
            val combined = triage.combineWords("$first|$second")
            val emoji = emojiAgent.getEmojiFor(combined)
//            fileDB.saveCombinationResult(first, second, combined)
            val withEmoji = "$combined $emoji".replace("\"", "")
            graphDb.saveCombinationResult(first, second, withEmoji)
            return withEmoji
        }
        return graphResult
    }

    @GET
    @Path("/hierarchyForNode")
    @Produces("application/json")
    fun getHierarchyForNode(@QueryParam("nodeName") nodeName: String): Response {
        return Response.ok(graphDb.getHierarchy(nodeName)).build()
    }

    @DELETE
    @Path("/allCombinations")
    fun deleteCombinations() {
        graphDb.clear()
//        fileDB.clearCombinations()
    }

    @GET
    @Path("/allCombinations")
    fun getAllCombinations(): Collection<String?> {
//        return fileDB.getAllResults()
        return (defValues + graphDb.getAllResults()).distinct()
    }

    @GET
    @Path("/explain")
    fun explain(@QueryParam("first") first: String, @QueryParam("second") second: String, @QueryParam("result") result: String): String {
        return triage.explain("$first|$second|$result")
    }
}