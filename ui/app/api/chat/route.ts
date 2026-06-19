import { streamText, embed, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

const openRouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'mock-key',
});

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages } = await req.json();
  const latestMessage = messages[messages.length - 1].content;

  // 1. Reformulate question using LLM to extract keyword query
  const { text: queryText } = await generateText({
    model: openRouter('openai/gpt-4o-mini') as any,
    system: 'Reformulasikan input akademik menjadi 2-5 kata kunci pencarian skripsi dalam Bahasa Indonesia. Tuliskan HANYA kata kunci tersebut tanpa tanda baca atau teks penjelasan.',
    prompt: latestMessage,
  });

  // 2. Embed the query text
  const { embedding } = await embed({
    model: openRouter.embedding(process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small') as any,
    value: queryText,
  });

  // 3. Query Qdrant
  const points = await qdrant.search('theses', {
    vector: embedding,
    limit: 5,
  });

  // 4. Form context string
  const context = points.map((p, i) => {
    const payload = p.payload || {};
    return `[Tesis ${i + 1}]
Judul: ${payload.title || 'No Title'}
Abstrak: ${payload.abstract || ''}
Penulis: ${Array.isArray(payload.authors) ? payload.authors.join(', ') : ''}
Tahun: ${payload.year}
Program Studi: ${payload.division}
URL: ${payload.url}`;
  }).join('\n\n');

  // 5. Stream response
  const systemPrompt = `Anda adalah CariSkripsi UPI, asisten AI untuk repositori skripsi Universitas Pendidikan Indonesia.
Tugas Anda adalah menjawab pertanyaan civitas akademika berdasarkan data tesis yang relevan di bawah.
Tuliskan jawaban dalam Bahasa Indonesia yang formal dan ilmiah.
Tulis kutipan inline seperti [Tesis 1], [Tesis 2], dst. untuk mendukung pernyataan Anda.
Bila data tidak memiliki hubungan apa pun dengan pertanyaan, jawab dengan sopan bahwa data tidak ditemukan di repositori skripsi UPI.

Data Tesis Terkait:
${context}`;

  const result = await streamText({
    model: openRouter('google/gemini-2.5-flash') as any,
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
