import dotenv from 'dotenv';
import { runIngestionPipeline } from './ingest';
import path from 'path';

dotenv.config();

const parquetFilePath = process.env.PARQUET_FILE_PATH || path.join(__dirname, '../data/repository-upi.parquet');
runIngestionPipeline(parquetFilePath).catch(console.error);
