import { asyncBufferFromFile, parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import { ThesisRecord, ThesisRecordSchema } from 'service';

export async function parseParquetFile(filePath: string): Promise<ThesisRecord[]> {
  const file = await asyncBufferFromFile(filePath);
  const rawObjects = await parquetReadObjects({ file, compressors });

  const cleanedRecords: ThesisRecord[] = [];

  for (const obj of rawObjects) {
    // subject_codes is stored as a list; filter to actual subject strings (not 'divisions' etc.)
    let subjectCodes: string[] = [];
    if (Array.isArray(obj.subject_codes)) {
      subjectCodes = obj.subject_codes.map(String).filter(
        (s) => s !== 'divisions' && s.length > 0
      );
    }

    // pdf_urls may be an array — we fall back to eprint_url if empty
    const eprintUrl = String(obj.eprint_url || 'https://repository.upi.edu');

    const doc = {
      id: String(obj.id ?? cleanedRecords.length + 1),
      title: String(obj.title || 'Untitled'),
      abstract_id: String(obj.abstract_id || ''),
      abstract_en: String(obj.abstract_en || ''),
      author: String(obj.author || 'Unknown'),
      // year may come as BigInt from parquet
      year: Number(obj.year ?? 2000),
      degree_type: String(obj.degree_type || 'S1'),
      division_name: String(obj.division_name || 'Unknown'),
      division_code: String(obj.division_code || ''),
      eprint_url: eprintUrl,
      subject_codes: subjectCodes,
    };

    const parsed = ThesisRecordSchema.safeParse(doc);
    if (parsed.success) {
      cleanedRecords.push(parsed.data);
    }
  }

  return cleanedRecords;
}
