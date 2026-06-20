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
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response('Bad Request: Invalid JSON body', { status: 400 });
    }

    const { messages } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Bad Request: Missing messages array', { status: 400 });
    }

    const latestMessage = messages[messages.length - 1]?.content;
    if (typeof latestMessage !== 'string') {
      return new Response('Bad Request: Message content must be a string', { status: 400 });
    }

    // 1. Reformulate question using LLM to extract keyword query
    const recentMessages = messages.slice(-5);
    const transcript = recentMessages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const { text: queryText } = await generateText({
      model: openRouter('openai/gpt-4o-mini') as any,
      system: 'Reformulasikan input akademik menjadi 2-5 kata kunci pencarian skripsi dalam Bahasa Indonesia berdasarkan konteks percakapan. Tuliskan HANYA kata kunci tersebut tanpa tanda baca atau teks penjelasan.',
      prompt: transcript,
      maxTokens: 100,
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
      const title = payload.title || 'Untitled';
      const abstract = payload.abstract || '';
      const authors = (Array.isArray(payload.authors) ? payload.authors.join(', ') : '') || 'Unknown';
      const year = payload.year || 'Unknown';
      const division = payload.division || 'Unknown';
      const url = payload.url || '';
      return `[Tesis ${i + 1}]
Judul: ${title}
Abstrak: ${abstract}
Penulis: ${authors}
Tahun: ${year}
Program Studi: ${division}
URL: ${url}`;
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
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
