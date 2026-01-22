import {
    UIMessage,
    UIDataTypes,
    streamText,
    tool,
    convertToModelMessages,
    stepCountIs,
    InferUITools,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/embeddings";

const tools = {
    search_notes: tool({
        description: "Search the user's notes using semantic search to find relevant information.",
        inputSchema: z.object({
            query: z.string().describe("The search query to find relevant notes"),
        }),
        execute: async ({ query }: { query: string }) => {
            try {
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) return { error: "User not authenticated" };

                // 1. Generate embedding for the search query
                const queryEmbedding = await generateEmbedding(query);

                // 2. Search Supabase for similar notes
                // We use naming that exactly matches the SQL function parameters
                const { data: notes, error: searchError } = await supabase.rpc('search_notes', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.1, // Even lower threshold for testing
                    match_count: 5,
                    filter_user_id: user.id
                });

                if (searchError) {
                    console.error("Supabase search error:", searchError);
                    return { error: `Database error: ${searchError.message}` };
                }

                if (!notes || notes.length === 0) {
                    return { message: "No relevant notes found in your database. Suggest creating a note first." };
                }

                // 3. Return results
                return {
                    count: notes.length,
                    notes: notes.map((n: any) => ({
                        id: n.note_id,
                        title: n.title,
                        content: n.chunk_content || n.body,
                        similarity: Math.round(n.similarity * 100) + "%"
                    }))
                };
            } catch (err) {
                console.error("Search tool error:", err);
                return { error: "Failed to execute search." };
            }
        },
    }),
};

export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
    try {
        const { messages }: { messages: ChatMessage[] } = await req.json();

        const result = streamText({
            model: openai("gpt-4o-mini"),
            system: "You are SmartNotes AI, a helpful assistant for the SmartNotes application. You help users manage their notes, summarize information, and answer questions concisely and professionally. Use the search_notes tool when the user asks about their notes or when you need information from their notes to answer a question. When you refer to a specific note found in the search results, ALWAYS provide a link for the user to open it using the following format: [See Note](/note-viewer/ID) where ID is the EXACT UUID provided in the search results. Example: [See Note](/note-viewer/83893dae-...).",
            messages: convertToModelMessages(messages),
            tools,
            stopWhen: stepCountIs(2),
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Error in chat API:", error);
        return Response.json({ error: "Failed to process chat request" }, { status: 500 });
    }
}
