import { KnowledgeChunk } from "../entities/KnowledgeChunk";

export interface PdfDocumentInput {
  documentId: string;
  fileName: string;
  buffer: Buffer;
}

export interface DocumentChunkingService {
  chunkPdf(input: PdfDocumentInput): Promise<KnowledgeChunk[]>;
}

