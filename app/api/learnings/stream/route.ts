import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();
        const result = await streamText({
            model: openai('gpt-4.1-nano'),
            prompt: prompt,
        });

        // we can check the token usage after the response is generated
        const usage = await result.usage;
        console.log("input tokens usage:", usage.inputTokens);
        console.log("output tokens usage:", usage.outputTokens);
        console.log("total tokens usage:", usage.totalTokens);

        return result.toUIMessageStreamResponse(); // stream the response to FE
    } catch (error) {
        console.error("Error generating completion:", error);
        return Response.json({ error: "Error generating completion" }, { status: 500 });
    }
}