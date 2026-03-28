import { AskQuestionDTO } from "../dto/AskQuestionDTO";
import { AssistantAnswer } from "../../domain/entities/AssistantAnswer";
import { VectorRepository } from "../../domain/repositories/VectorRepository";
import { ChatCompletionService } from "../../domain/services/ChatCompletionService";

export class AskAssistantUseCase {
  constructor(
    private readonly vectorRepository: VectorRepository,
    private readonly chatCompletionService: ChatCompletionService,
    private readonly defaultTopK: number
  ) {}

  async execute(input: AskQuestionDTO): Promise<AssistantAnswer> {
    const topK = input.topK ?? this.defaultTopK;
    const contextChunks = await this.vectorRepository.similaritySearch(input.question, topK);

    if (contextChunks.length === 0) {
      return {
        answer: "No encontré contexto relevante en los documentos cargados.",
        sources: [],
        retrievedChunks: 0
      };
    }

    return this.chatCompletionService.generateAnswer(input.question, contextChunks);
  }
}

