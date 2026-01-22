import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();
        const { text } = await generateText({
            model: openai('gpt-4.1-nano'),
            prompt: prompt,
        });

        return Response.json({ text });
    } catch (error) {
        console.error("Error generating completion:", error);
        return Response.json({ error: "Error generating completion" }, { status: 500 });
    }
}
