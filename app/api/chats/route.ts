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

// Import xmcp tools
import createNoteTool, { schema as createNoteSchema } from "@/tools/create-note";
import updateNoteTool, { schema as updateNoteSchema } from "@/tools/update-note";
import deleteNoteTool, { schema as deleteNoteSchema } from "@/tools/delete-note";

// Type for the search_notes RPC function response
// This matches the structure returned by the Supabase SQL function
interface SearchNoteResult {
    note_id: string;
    title: string;
    body: string;
    chunk_content: string;
    similarity: number;
}

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

                // Generate embedding for the search query
                const queryEmbedding = await generateEmbedding(query);

                // Call the Supabase RPC function for vector similarity search
                // - query_embedding: The vector representation of the user's search query
                // - match_threshold: Minimum similarity score (0-1). Lower = more results but less relevant.
                //                    0.1 is lenient for testing; production might use 0.5-0.7
                // - match_count: Maximum number of results to return
                // - filter_user_id: Ensures we only search the current user's notes
                const { data: notes, error: searchError } = await supabase.rpc('search_notes', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.3,
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

                // Return results
                return {
                    count: notes.length,
                    notes: notes.map((n: SearchNoteResult) => ({
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
    create_note: tool({
        description: "Create a new note for the user.",
        inputSchema: z.object(createNoteSchema),
        execute: async (args: z.infer<z.ZodObject<typeof createNoteSchema>>) => createNoteTool(args),
    }),
    update_note: tool({
        description: "Update an existing note's title or content.",
        inputSchema: z.object(updateNoteSchema),
        execute: async (args: z.infer<z.ZodObject<typeof updateNoteSchema>>) => updateNoteTool(args),
    }),
    delete_note: tool({
        description: "Delete a note permanently. Always ask for confirmation before calling this.",
        inputSchema: z.object(deleteNoteSchema),
        execute: async (args: z.infer<z.ZodObject<typeof deleteNoteSchema>>) => deleteNoteTool(args),
    }),
};

export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;
// TReasoningContent - Type for "reasoning" content (chain-of-thought)
// TUIDataTypes - Type for UI-specific data types
// TTools - Type for the tools available

// Using never here means: "We are not using reasoning content in our messages."
// Some AI models (like Claude with extended thinking) can return "reasoning" or "thinking" content alongside the response. 
// Since this chat uses gpt-4o-mini which doesn't have that feature, we explicitly say "there will never be reasoning content" by using never

//UIMessage<{ thinking: string }, UIDataTypes, ChatTools>

export async function POST(req: Request) {
    try {
        const { messages }: { messages: ChatMessage[] } = await req.json();

        const result = streamText({
            model: openai("gpt-4o-mini"),
            system: `You are SmartNotes AI, a specialized assistant for the SmartNotes application. Your sole purpose is to help users manage, search, and understand their own notes.
                        STRICT BEHAVIOR RULES:
                        1. GREETINGS: For simple greetings (e.g., "Hello", "How are you?"), respond warmly and professionally WITHOUT using any tools.
                        2. SEARCHING: For any question about finding info or finding specific notes, use 'search_notes'.
                        3. NOTE IDENTIFICATION:
                           - When a user asks to update or delete a note, search your conversation history for the most recent 'note_id' or 'id' returned by a tool (like 'search_notes').
                           - If a unique ID exists in the history, use it for 'update_note' or 'delete_note'.
                           - If NO ID exists in the context, DO NOT guess. Instead, ask the user: "Which note would you like me to [update/delete]?" or suggest searching for it first.
                           - If multiple notes were recently found and it's unclear which one the user means, list them and ask for clarification: "I found multiple notes (A, B, C). Which one should I [update/delete]?"
                        4. DELETION: ALWAYS ask the user "Are you sure you want to delete '[Note Title]'?" before calling the 'delete_note' tool.
                        5. LINKING: When you refer to a specific note, ALWAYS provide a link: [See Note](/note-viewer/ID) where ID is the UUID.
                    Maintain a professional, helpful, and concise tone at all times.`,
            messages: convertToModelMessages(messages),
            tools,
            stopWhen: stepCountIs(2), //one search, one response creation
        });
        /*
        messages: convertToModelMessages(messages)
        ↑ Takes UIMessage[] -> Messages optimized for the frontend - includes tool invocations, UI-specific data, and rendering info.
            {
                id: "abc123",
                role: "user",
                content: "Find my notes about TypeScript",
                createdAt: new Date(),
                // UI-specific fields for rendering tool calls, etc.
                toolInvocations: [...],
                data: {...}
            }
        ↓ Returns CoreMessage[] -> format that AI models (like GPT-4) actually expect
            {
                role: "user",
                content: "Find my notes about TypeScript"
            }
        */

        //Convert back to UIMessage format AND stream it
        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Error in chat API:", error);
        return Response.json({ error: "Failed to process chat request" }, { status: 500 });
    }
}
