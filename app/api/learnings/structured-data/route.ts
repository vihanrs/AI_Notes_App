import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { recipeSchema } from "./schema";

export async function POST(req: Request) {
    try {
        const { dish } = await req.json();
        const result = streamObject({
            model: openai('gpt-4.1-nano'),
            schema: recipeSchema,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant for grade 10 students. Explain concepts in a simple and easy to understand manner."
                },
                {
                    role: "user",
                    content: `Extract the recipe from the following dish: ${dish}`
                },
            ],
        });
        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Error generating completion:", error);
        return Response.json({ error: "Error generating completion" }, { status: 500 });
    }
}
