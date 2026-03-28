export interface AssistantSource {
  documentId: string;
  fileName: string;
  page: number;
}

export interface AssistantAnswer {
  answer: string;
  sources: AssistantSource[];
  retrievedChunks: number;
}

