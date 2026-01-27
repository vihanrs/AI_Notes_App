import {
    UIMessage,
    UIDataTypes,
    streamText,
    convertToModelMessages,
    stepCountIs,
    InferUITools,
} from "ai";
import { AI_CONFIG } from "@/lib/ai/config";

// Import xmcp tools - now includes search_notes, create_note, update_note, delete_note
import { tools } from "@xmcp/tools";

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
            model: AI_CONFIG.model,
            system: AI_CONFIG.systemPrompt,
            messages: convertToModelMessages(messages),
            tools,
            stopWhen: stepCountIs(AI_CONFIG.maxSteps),
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
