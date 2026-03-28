import { createApp } from "./api/app";
import { ChatController } from "./api/controllers/ChatController";
import { DocumentController } from "./api/controllers/DocumentController";
import { AskAssistantUseCase } from "./application/use-cases/AskAssistantUseCase";
import { UploadPdfUseCase } from "./application/use-cases/UploadPdfUseCase";
import { env } from "./infrastructure/config/env";
import { MistralEmbeddingsProvider } from "./infrastructure/embeddings/MistralEmbeddingsProvider";
import { MistralChatCompletionService } from "./infrastructure/llm/MistralChatCompletionService";
import { LangChainPdfChunkingService } from "./infrastructure/pdf/LangChainPdfChunkingService";
import { PineconeVectorRepository } from "./infrastructure/vector/PineconeVectorRepository";

const bootstrap = async (): Promise<void> => {
  const embeddingsProvider = new MistralEmbeddingsProvider(env.MISTRAL_API_KEY, env.MISTRAL_EMBEDDING_MODEL);

  const vectorRepository = new PineconeVectorRepository({
    apiKey: env.PINECONE_API_KEY,
    indexName: env.PINECONE_INDEX_NAME,
    namespace: env.PINECONE_NAMESPACE,
    embeddings: embeddingsProvider.getEmbeddings()
  });

  const pdfChunkingService = new LangChainPdfChunkingService({
    chunkSize: 1000,
    chunkOverlap: 150
  });
  const chatCompletionService = new MistralChatCompletionService(env.MISTRAL_API_KEY, env.MISTRAL_MODEL);

  const uploadPdfUseCase = new UploadPdfUseCase(pdfChunkingService, vectorRepository);
  const askAssistantUseCase = new AskAssistantUseCase(vectorRepository, chatCompletionService, env.DEFAULT_TOP_K);

  const app = createApp({
    documentController: new DocumentController(uploadPdfUseCase),
    chatController: new ChatController(askAssistantUseCase)
  });

  app.listen(env.PORT, () => {
    console.log(`Backend RAG escuchando en http://localhost:${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("No se pudo iniciar el backend:", error);
  process.exit(1);
});
