import { randomUUID } from "crypto";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { KnowledgeChunk } from "../../domain/entities/KnowledgeChunk";
import { DocumentChunkingService, PdfDocumentInput } from "../../domain/services/DocumentChunkingService";

interface LangChainPdfChunkingServiceOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export class LangChainPdfChunkingService implements DocumentChunkingService {
  private readonly splitter: RecursiveCharacterTextSplitter;

  constructor(options: LangChainPdfChunkingServiceOptions = {}) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize ?? 1000,
      chunkOverlap: options.chunkOverlap ?? 150
    });
  }

  async chunkPdf(input: PdfDocumentInput): Promise<KnowledgeChunk[]> {
    // Node Buffer can be typed as ArrayBufferLike; BlobPart in TS expects ArrayBuffer.
    // Copy into a fresh Uint8Array to guarantee an ArrayBuffer-backed view.
    const bytes = new Uint8Array(input.buffer.length);
    bytes.set(input.buffer);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const loader = new PDFLoader(blob, { splitPages: true });
    const pages = await loader.load();
    const splitDocuments = await this.splitter.splitDocuments(pages);

    return splitDocuments
      .map((document, chunkIndex) => {
        const metadata = document.metadata as Record<string, unknown>;
        const loc = metadata.loc as { pageNumber?: number } | undefined;
        const parsedPage = Number(loc?.pageNumber ?? metadata.page ?? 1);

        return {
          id: randomUUID(),
          content: document.pageContent,
          metadata: {
            documentId: input.documentId,
            fileName: input.fileName,
            page: Number.isFinite(parsedPage) ? parsedPage : 1,
            chunkIndex
          }
        };
      })
      .filter((chunk) => chunk.content.trim().length > 0);
  }
}
