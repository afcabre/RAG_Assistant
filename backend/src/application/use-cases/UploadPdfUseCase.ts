import { randomUUID } from "crypto";
import { UploadDocumentDTO } from "../dto/UploadDocumentDTO";
import { VectorRepository } from "../../domain/repositories/VectorRepository";
import { DocumentChunkingService } from "../../domain/services/DocumentChunkingService";

export interface UploadPdfResult {
  documentId: string;
  fileName: string;
  chunksStored: number;
}

export class UploadPdfUseCase {
  constructor(
    private readonly chunkingService: DocumentChunkingService,
    private readonly vectorRepository: VectorRepository
  ) {}

  async execute(input: UploadDocumentDTO): Promise<UploadPdfResult> {
    const documentId = randomUUID();
    const chunks = await this.chunkingService.chunkPdf({
      documentId,
      fileName: input.fileName,
      buffer: input.buffer
    });

    if (chunks.length === 0) {
      throw new Error("No se pudo generar contexto desde el PDF");
    }

    await this.vectorRepository.upsertChunks(chunks);

    return {
      documentId,
      fileName: input.fileName,
      chunksStored: chunks.length
    };
  }
}

