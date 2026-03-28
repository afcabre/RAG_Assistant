import { KnowledgeChunk } from "../entities/KnowledgeChunk";

export interface VectorRepository {
  upsertChunks(chunks: KnowledgeChunk[]): Promise<void>;
  similaritySearch(query: string, topK: number): Promise<KnowledgeChunk[]>;
}

