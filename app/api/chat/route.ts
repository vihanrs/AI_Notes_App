// import { openai } from '@ai-sdk/openai'
// import { streamText, tool } from 'ai'
// import { createClient } from '@/lib/supabase/server'
// import { z } from 'zod'
// import { generateEmbedding } from '@/lib/embeddings'

// export const maxDuration = 30

// export async function POST(req: Request) {
//     const { messages } = await req.json()
//     const supabase = await createClient()

//     // Get authenticated user
//     const { data: { user }, error: authError } = await supabase.auth.getUser()
//     if (authError || !user) {
//         return new Response('Unauthorized', { status: 401 })
//     }
//     if (!process.env.OPENAI_API_KEY) {
//         return new Response('OpenAI API Key is missing. Please add it to your .env.local file.', { status: 500 })
//     }

//     const result = streamText({
//         model: openai('gpt-4o'),
//         messages,
//         system: `You are a helpful AI note-taking assistant. 
//     You have access to the user's notes through tools.
//     When asked about their notes, always use the search_notes tool to find relevant information.
//     If you find multiple relevant notes, summarize them and provide a clear answer.
//     If no notes are found, be honest and say you couldn't find any information in their notes.
//     Keep your responses concise and helpful.`,
//         tools: {
//             search_notes: tool({
//                 description: 'Search through the user\'s notes for relevant information',
//                 parameters: z.object({
//                     query: z.string().describe('The search query to find relevant notes'),
//                 }),
//                 execute: async ({ query }) => {
//                     // 1. Generate embedding for the query
//                     const embedding = await generateEmbedding(query)

//                     // 2. Search notes using similarity search
//                     const { data: notes, error } = await supabase.rpc('search_notes', {
//                         query_embedding: embedding,
//                         match_threshold: 0.3,
//                         match_count: 5,
//                         filter_user_id: user.id,
//                     })

//                     if (error) {
//                         console.error('Error searching notes:', error)
//                         return { error: 'Failed to search notes' }
//                     }

//                     return { notes }
//                 },
//             }),
//         },
//     })

//     return result.toTextStreamResponse()
// }
