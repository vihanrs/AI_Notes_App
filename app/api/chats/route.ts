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
            system: `You are SmartNotes AI, a specialized assistant for the SmartNotes application. Your sole purpose is to help users manage, search, and understand their own notes.

STRICT BEHAVIOR RULES:
1. GREETINGS: For simple greetings (e.g., "Hello", "How are you?"), respond warmly and professionally WITHOUT using any tools.
2. NOTES-RELATED QUERIES: For any question about the user's content, summaries, or finding information, you MUST use the 'search_notes' tool first.
3. RESTRICTED TOPICS: If a user asks general knowledge questions, current events, or anything unrelated to their notes or this application, politely explain that you are specialized ONLY in assisting with their notes and cannot answer general questions.
4. LINKING: When you refer to a specific note found in the search results, ALWAYS provide a link using the format: [See Note](/note-viewer/ID) where ID is the EXACT UUID provided in the search results.

Maintain a professional, helpful, and concise tone at all times.`,
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
