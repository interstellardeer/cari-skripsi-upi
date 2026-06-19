import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export async function getEmbedding(value: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined in the environment.');
  }

  const openRouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });

  const modelName = process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';

  const { embedding } = await embed({
    model: openRouter.embedding(modelName),
    value,
  });

  return embedding;
}
