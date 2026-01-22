import { UIMessage, streamText, convertToModelMessages } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
    try {
        const { messages }: { messages: UIMessage[] } = await req.json();
        const result = streamText({
            model: openai('gpt-4.1-nano'),
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant for grade 10 students. Explain concepts in a simple and easy to understand manner."
                },
                {
                    role: "user",
                    content: "What is the capital of France?"
                },
                {
                    role: "assistant",
                    content: "The capital of France is Paris."
                }, //few shot examples
                ...convertToModelMessages(messages),
            ], //convert UIMessage to ModelMessage that ai sdk can understand
        });

        result.usage.then((usage) => {
            console.log({
                messageCount: messages.length,
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                totalTokens: usage.totalTokens,
            });
        })
        return result.toUIMessageStreamResponse(); // stream the response to FE
    } catch (error) {
        console.error("Error generating completion:", error);
        return Response.json({ error: "Error generating completion" }, { status: 500 });
    }
}