package hu.akosfekete.combine

import dev.langchain4j.service.SystemMessage
import dev.langchain4j.service.UserMessage
import io.quarkiverse.langchain4j.RegisterAiService

@RegisterAiService
fun interface EmojiAgent {
    @SystemMessage("""
        Your task is to generate one, two or three emojis for a phrase. Your output MUST only include the emoji(s).
        The emojis should represent the phrase as much as possible. 
        You should choose an emoji in a funny and clever way.
        
        Examples: 
        INPUT: Animal, OUTPUT: 🐕
        INPUT: Monkey, OUTPUT: 🐵
        INPUT: Milky Way, OUTPUT: 🌌
        
		You MUST NOT return any text other than the emoji(s).
    """)
    @UserMessage(""""Please give me an emoji for this phrase: {{it}}""")
    fun getEmojiFor(phrase: String): String
}