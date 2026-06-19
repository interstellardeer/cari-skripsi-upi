import { parseParquetFile } from './parse';
import { getEmbedding, ensureCollectionExists, upsertTheses } from 'service';

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

    const points = await Promise.all(
      chunk.map(async (record) => {
        // Embed the title and abstract combination
        const textToEmbed = `${record.title} — ${record.abstract}`;
        const vector = await getEmbedding(textToEmbed);
        return {
          id: record.id,
          vector,
          payload: record,
        };
      })
    );

    await upsertTheses(points);
    console.log(`Successfully upserted batch ${i / batchSize + 1}`);

    // Introduce rate limiting delay of 100ms between API calls/batches
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('Ingestion pipeline completed successfully!');
}
