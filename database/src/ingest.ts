import { parseParquetFile } from './parse';
import { getEmbedding, getEmbeddings, ensureCollectionExists, upsertTheses } from 'service';

export async function runIngestionPipeline(filePath: string): Promise<void> {
  console.log(`Starting ingestion pipeline for file: ${filePath}`);
  const records = await parseParquetFile(filePath);
  console.log(`Successfully parsed ${records.length} records.`);

  if (records.length === 0) return;

  // 1. Get embedding length from model by embedding a test word
  const testEmbed = await getEmbedding('test');
  const embeddingDim = testEmbed.length;
  await ensureCollectionExists(embeddingDim);

  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} (${chunk.length} items)...`);

    const textsToEmbed = chunk.map((record) => `${record.title} — ${record.abstract_id}`);
    let vectors: number[][] | null = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        vectors = await getEmbeddings(textsToEmbed);
        break;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        console.warn(`Attempt ${attempt} to get embeddings for batch ${i / batchSize + 1} failed. Retrying in 500ms... Error:`, error);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const points = chunk.map((record, idx) => ({
      id: record.id,
      vector: vectors![idx],
      payload: record,
    }));

    await upsertTheses(points);
    console.log(`Successfully upserted batch ${i / batchSize + 1}`);

    // Introduce rate limiting delay of 100ms between API calls/batches
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('Ingestion pipeline completed successfully!');
}
