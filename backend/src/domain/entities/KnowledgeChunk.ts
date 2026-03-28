export interface ChunkMetadata {
  documentId: string;
  fileName: string;
  page: number;
  chunkIndex: number;
}

export interface KnowledgeChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  score?: number;
}

