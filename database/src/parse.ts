import { asyncBufferFromFile, parquetReadObjects } from 'hyparquet';
import { ThesisRecord, ThesisRecordSchema } from 'service';

export async function parseParquetFile(filePath: string): Promise<ThesisRecord[]> {
  const file = await asyncBufferFromFile(filePath);
  const rawObjects = await parquetReadObjects({ file });

  const cleanedRecords: ThesisRecord[] = [];

  for (const obj of rawObjects) {
    let authorsParsed: string[] = [];
    if (typeof obj.authors === 'string') {
      try {
        const parsed = JSON.parse(obj.authors);
        authorsParsed = Array.isArray(parsed) ? parsed : [obj.authors];
      } catch {
        authorsParsed = [obj.authors];
      }
    } else if (Array.isArray(obj.authors)) {
      authorsParsed = obj.authors.map(String);
    }

    let keywordsParsed: string[] = [];
    if (typeof obj.keywords === 'string') {
      try {
        const parsed = JSON.parse(obj.keywords);
        keywordsParsed = Array.isArray(parsed) ? parsed : [obj.keywords];
      } catch {
        keywordsParsed = [obj.keywords];
      }
    } else if (Array.isArray(obj.keywords)) {
      keywordsParsed = obj.keywords.map(String);
    }

    const doc = {
      id: String(obj.id || cleanedRecords.length + 1),
      title: String(obj.title || 'Untitled'),
      abstract: String(obj.abstract || ''),
      authors: authorsParsed,
      year: Number(obj.year || 2000),
      division: String(obj.division || 'Unknown'),
      url: String(obj.url || 'https://repository.upi.edu'),
      keywords: keywordsParsed,
    };

    const parsed = ThesisRecordSchema.safeParse(doc);
    if (parsed.success) {
      cleanedRecords.push(parsed.data);
    }
  }

  return cleanedRecords;
}
