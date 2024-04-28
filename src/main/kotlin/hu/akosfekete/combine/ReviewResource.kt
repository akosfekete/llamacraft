package hu.akosfekete.combine

import hu.akosfekete.db.FileDB
import jakarta.enterprise.inject.Default
import jakarta.inject.Inject
import jakarta.ws.rs.DELETE
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.QueryParam


@Path("/review")
class ReviewResource {
    @Inject
    lateinit var triage: CombineAgent

    @Inject
    @field: Default
    lateinit var fileDB: FileDB


    @GET
    @Path("/combine/")
    fun combineWords(@QueryParam("first") first: String, @QueryParam("second") second: String): String {
        val combinationResult = fileDB.getCombinationResult(first, second)
        if (combinationResult == null) {
            val combined = triage.combineWords("$first|$second")
            fileDB.saveCombinationResult(first, second, combined)
            return combined
        }
        return combinationResult
    }

    @DELETE
    @Path("/allCombinations")
    fun deleteCombinations() {
        fileDB.clearCombinations()
    }

    @GET
    @Path("/allCombinations")
    fun getAllCombinations(): Collection<String?> {
        return fileDB.getAllResults()
    }

    @GET
    @Path("/explain")
    fun explain(@QueryParam("first") first: String, @QueryParam("second") second: String, @QueryParam("result") result: String): String {
        return triage.explain("$first|$second|$result")
    }
}