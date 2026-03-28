import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMistralAI } from "@langchain/mistralai";
import { AssistantAnswer, AssistantSource } from "../../domain/entities/AssistantAnswer";
import { KnowledgeChunk } from "../../domain/entities/KnowledgeChunk";
import { ChatCompletionService } from "../../domain/services/ChatCompletionService";

export class MistralChatCompletionService implements ChatCompletionService {
  private readonly model: ChatMistralAI;

  constructor(apiKey: string, model: string) {
    this.model = new ChatMistralAI({
      apiKey,
      model,
      temperature: 0.2
    });
  }

  async generateAnswer(question: string, contextChunks: KnowledgeChunk[]): Promise<AssistantAnswer> {
    const contextBlock = contextChunks
      .map(
        (chunk, index) =>
          `[${index + 1}] Archivo: ${chunk.metadata.fileName} | Pagina: ${chunk.metadata.page}\n${chunk.content}`
      )
      .join("\n\n");

    const response = await this.model.invoke([
      new SystemMessage(
        [
          "Eres un asistente empresarial que responde en espanol.",
          "Solo debes responder usando el contexto recuperado.",
          "Si el contexto no alcanza, dilo de forma explicita.",
          "Incluye respuestas concretas y evita inventar informacion."
        ].join(" ")
      ),
      new HumanMessage(
        `Pregunta:\n${question}\n\nContexto recuperado:\n${contextBlock}\n\nResponde de forma clara y directa.`
      )
    ]);

    return {
      answer: this.extractText(response.content),
      sources: this.extractSources(contextChunks),
      retrievedChunks: contextChunks.length
    };
  }

  private extractText(content: unknown): string {
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }

          if (part && typeof part === "object" && "text" in part) {
            const text = (part as { text?: unknown }).text;
            return typeof text === "string" ? text : "";
          }

          return "";
        })
        .join("\n")
        .trim();
    }

    return "No fue posible interpretar la respuesta del modelo.";
  }

  private extractSources(contextChunks: KnowledgeChunk[]): AssistantSource[] {
    const dedup = new Map<string, AssistantSource>();

    contextChunks.forEach((chunk) => {
      const key = `${chunk.metadata.documentId}-${chunk.metadata.page}`;
      if (!dedup.has(key)) {
        dedup.set(key, {
          documentId: chunk.metadata.documentId,
          fileName: chunk.metadata.fileName,
          page: chunk.metadata.page
        });
      }
    });

    return [...dedup.values()];
  }
}

