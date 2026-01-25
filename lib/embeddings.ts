import { openai } from '@ai-sdk/openai'
import { embed, embedMany } from 'ai'

const embeddingModel = openai.embedding('text-embedding-3-small')

/**
 * Generate embeddings for a single text value
 */
export async function generateEmbedding(value: string): Promise<number[]> {
    const { embedding } = await embed({
        model: embeddingModel,
        value,
    })
    return embedding
}

/**
 * Generate embeddings for a text by chunking and embedding each chunk
 */
export async function generateEmbeddings(value: string): Promise<{ content: string; embedding: number[] }[]> {
    const chunks = generateChunks(value)

    const { embeddings } = await embedMany({
        model: embeddingModel,
        values: chunks,
    })

    return embeddings.map((embedding, index) => ({
        content: chunks[index],
        embedding,
    }))
}

/**
 * Chunk text by splitting on double newlines (paragraphs)
 */
function generateChunks(input: string): string[] {
    return input
        .split('\n\n')
        .map((chunk) => chunk.trim())
        .filter(Boolean)
}