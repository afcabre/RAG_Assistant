import { Embeddings } from "@langchain/core/embeddings";
import { Document } from "@langchain/core/documents";
import { PineconeStore } from "@langchain/pinecone";
import { KnowledgeChunk } from "../../domain/entities/KnowledgeChunk";
import { VectorRepository } from "../../domain/repositories/VectorRepository";

interface PineconeVectorRepositoryConfig {
  apiKey: string;
  indexName: string;
  namespace: string;
  embeddings: Embeddings;
}

export class PineconeVectorRepository implements VectorRepository {
  private readonly apiKey: string;
  private readonly indexName: string;
  private readonly namespace: string;
  private readonly embeddings: Embeddings;
  private storePromise: Promise<PineconeStore> | null;

  constructor(config: PineconeVectorRepositoryConfig) {
    this.apiKey = config.apiKey;
    this.indexName = config.indexName;
    this.namespace = config.namespace;
    this.embeddings = config.embeddings;
    this.storePromise = null;
  }

  async upsertChunks(chunks: KnowledgeChunk[]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    const store = await this.getStore();
    const documents = chunks.map((chunk) =>
      new Document({
        pageContent: chunk.content,
        metadata: {
          chunkId: chunk.id,
          documentId: chunk.metadata.documentId,
          fileName: chunk.metadata.fileName,
          page: chunk.metadata.page,
          chunkIndex: chunk.metadata.chunkIndex
        }
      })
    );

    await store.addDocuments(documents, {
      ids: chunks.map((chunk) => chunk.id)
    });
  }

  async similaritySearch(query: string, topK: number): Promise<KnowledgeChunk[]> {
    const store = await this.getStore();
    const results = await store.similaritySearchWithScore(query, topK);

    return results.map(([document, score], index) => {
      const metadata = document.metadata as Record<string, unknown>;
      const page = Number(metadata.page ?? 1);
      const chunkIndex = Number(metadata.chunkIndex ?? index);

      return {
        id: String(metadata.chunkId ?? `chunk-${index}`),
        content: document.pageContent,
        metadata: {
          documentId: String(metadata.documentId ?? "unknown-document"),
          fileName: String(metadata.fileName ?? "unknown-file"),
          page: Number.isFinite(page) ? page : 1,
          chunkIndex: Number.isFinite(chunkIndex) ? chunkIndex : index
        },
        score
      };
    });
  }

  private getStore(): Promise<PineconeStore> {
    if (!this.storePromise) {
      this.storePromise = PineconeStore.fromExistingIndex(this.embeddings, {
        namespace: this.namespace,
        pineconeConfig: {
          indexName: this.indexName,
          config: {
            apiKey: this.apiKey
          }
        }
      });
    }

    return this.storePromise;
  }
}
