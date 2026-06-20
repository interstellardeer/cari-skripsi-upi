import { parseParquetFile } from './parse';
import { getEmbedding, getEmbeddings, ensureCollectionExists, upsertTheses, getQdrantClient } from 'service';

async function getExistingIds(): Promise<Set<string>> {
  try {
    const client = getQdrantClient();
    const existingIds = new Set<string>();
    let offset = 0;
    const limit = 1000;

    while (true) {
      const response = await client.scroll('theses', {
        limit,
        offset,
        with_payload: false,
      });

      for (const point of response.points) {
        existingIds.add(String(point.id));
      }

      if (response.points.length < limit) break;
      offset += limit;
    }

    console.log(`Found ${existingIds.size} existing records in Qdrant.`);
    return existingIds;
  } catch (error) {
    console.warn('Warning: Could not fetch existing IDs from Qdrant, will embed all records:', error);
    return new Set();
  }
}

export async function runIngestionPipeline(filePath: string): Promise<void> {
  console.log(`Starting ingestion pipeline for file: ${filePath}`);
  const records = await parseParquetFile(filePath);
  console.log(`Successfully parsed ${records.length} records.`);

  if (records.length === 0) return;

  const maxRecordsEnv = process.env.MAX_INGEST_RECORDS;
  const maxRecords = maxRecordsEnv ? parseInt(maxRecordsEnv, 10) : undefined;
  const recordsToIngest = maxRecords ? records.slice(0, maxRecords) : records;
  console.log(`Starting ingestion of ${recordsToIngest.length} records (out of ${records.length} parsed)...`);

  // 1. Get embedding length from model by embedding a test word
  const testEmbed = await getEmbedding('test');
  const embeddingDim = testEmbed.length;
  await ensureCollectionExists(embeddingDim);

  // 2. Fetch existing IDs to avoid re-embedding
  const existingIds = await getExistingIds();
  const newRecords = recordsToIngest.filter(record => !existingIds.has(String(record.id)));
  const skippedCount = recordsToIngest.length - newRecords.length;
  
  if (skippedCount > 0) {
    console.log(`Skipping ${skippedCount} records that are already in Qdrant. Processing ${newRecords.length} new records.`);
  }

  if (newRecords.length === 0) {
    console.log('All records are already in Qdrant. Nothing to ingest.');
    return;
  }

  const batchSize = 500;
  for (let i = 0; i < newRecords.length; i += batchSize) {
    const chunk = newRecords.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(newRecords.length / batchSize)} (${chunk.length} items)...`);

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
