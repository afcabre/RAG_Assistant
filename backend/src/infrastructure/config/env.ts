import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  PINECONE_API_KEY: z.string().min(1, "Falta PINECONE_API_KEY"),
  PINECONE_INDEX_NAME: z.string().min(1, "Falta PINECONE_INDEX_NAME"),
  PINECONE_NAMESPACE: z.string().default("rag-assistant-dev"),
  MISTRAL_API_KEY: z.string().min(1, "Falta MISTRAL_API_KEY"),
  MISTRAL_MODEL: z.string().default("mistral-medium-latest"),
  MISTRAL_EMBEDDING_MODEL: z.string().default("mistral-embed"),
  DEFAULT_TOP_K: z.coerce.number().int().min(1).max(15).default(5)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.errors.map((error) => `${error.path.join(".")}: ${error.message}`).join("\n");
  throw new Error(`Variables de entorno invalidas:\n${details}`);
}

export const env = parsed.data;
