package hu.akosfekete.db

import jakarta.annotation.PostConstruct
import jakarta.annotation.PreDestroy
import jakarta.enterprise.context.ApplicationScoped
import org.mapdb.DB
import org.mapdb.DBMaker.fileDB
import org.mapdb.Serializer

private val defValues = listOf("Earth", "Fire", "Wind", "Water")

@ApplicationScoped
class FileDB {
    lateinit var db: DB

    @PostConstruct
    fun initDb() {
        db = fileDB("test.db").fileMmapEnable().make()
    }

    fun getCombinationResult(first: String, second: String): String? {
        val combinations = combinations()
        val i = first.compareTo(second)
        val key = getKey(first, second, i)
        return combinations[key]
    }

    fun getAllResults(): Collection<String?> = (defValues + combinations().values).distinct()

    fun saveCombinationResult(first: String, second: String, result: String?) {
        val combinations = combinations()
        val i = first.compareTo(second)
        val key = getKey(first, second, i)
        combinations[key] = result
        db.commit()
    }

    fun clearCombinations() {
        combinations().clear()
        db.commit()
    }


    private fun combinations() = db.hashMap("combinations", Serializer.STRING, Serializer.STRING).createOrOpen()

    @PreDestroy
    fun destroy() {
        db.close()
    }

    companion object {
        private fun getKey(first: String, second: String, i: Int): String {
            return if (i < 0) "$first|$second" else "$second|$first"
        }
    }
}
