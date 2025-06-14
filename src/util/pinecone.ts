import { Pinecone } from '@pinecone-database/pinecone';
import { configDotenv } from 'dotenv';
configDotenv();
export const pc = new Pinecone({
  //@ts-ignore
  apiKey: process.env.PINECONE_API_KEY,
});