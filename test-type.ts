import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

async function test() {
    const { text } = await generateText({
        model: openai('gpt-4o'),
        prompt: "what is the capital of France?",
    });
    console.log(text);
}
