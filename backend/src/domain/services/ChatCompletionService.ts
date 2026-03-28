import { AssistantAnswer } from "../entities/AssistantAnswer";
import { KnowledgeChunk } from "../entities/KnowledgeChunk";

export interface ChatCompletionService {
  generateAnswer(question: string, contextChunks: KnowledgeChunk[]): Promise<AssistantAnswer>;
}

