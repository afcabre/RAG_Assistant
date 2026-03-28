import { Embeddings } from "@langchain/core/embeddings";
import { MistralAIEmbeddings } from "@langchain/mistralai";

export class MistralEmbeddingsProvider {
  private readonly embeddings: Embeddings;

  constructor(apiKey: string, model: string) {
    this.embeddings = new MistralAIEmbeddings({
      apiKey,
      model
    });
  }

  getEmbeddings(): Embeddings {
    return this.embeddings;
  }
}

