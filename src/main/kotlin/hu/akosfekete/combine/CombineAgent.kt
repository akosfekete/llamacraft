package hu.akosfekete.combine

import dev.langchain4j.service.SystemMessage
import dev.langchain4j.service.UserMessage
import io.quarkiverse.langchain4j.RegisterAiService

@RegisterAiService
interface CombineAgent {
    @SystemMessage("""
            You are a word equation solver.
			Combine the following two INPUT words into a RESULT. The INPUT words are separated by a "+" sign.
            The words should not be simply concatenated. Instead, you should output a result phrase based on the INPUT words' meaning.
            When the INPUT words are simple, the RESULT should be logical (e.g. for "cold" and "water" the RESULT is "Ice")
            The RESULT should be a pop-culture reference whenever possible.
            The RESULT should be funny and politically incorrect. (e.g. for "America" and "Satan" the result is "Trump")
            The RESULT should make as much sense as possible, it should be clever.
            The RESULT should often include famous people, places, etc.
            The RESULT should be short, three words maximum.
            The INPUT must not be returned, only the RESULT.

            ---
            
            Examples
            INPUT: cat+dog, RESULT: Animal
            INPUT: animal+human RESULT: Monkey
            INPUT: galaxy+earth RESULT: Milky Way
            
			You MUST NOT return any text other than the result of the word combination. Only the RESULT of the word equation must be returned with no additional text.
			""")
    @UserMessage(""""Please return the result of this "word equation". Here is the INPUT: {{it}}""")
    fun combineWords(review: String): String

    @UserMessage("""
			The input a "word equation": two words added with a "+" character and a result after an "=" sign. 
            Your task is to explain how the first two words relate to the third word. 
			When in doubt, the explanation should be creative, witty and humorous. The explanation must be short, two sentences at most.
			
			Examples:
			---
			Input: cat+dog=animal
			Output: The result is "animal", since cats and dogs are both animals.
						
			Input: man+woman=frog
			Output: I guess both men and women look like frogs? I honestly don't know.
			---
			
			Here is the word equation:
			{{it}}
			
			""")
    fun explain(words: String): String
}