import { z } from "zod";

export const AskQuestionSchema = z.object({
  question: z.string().min(2, "La pregunta es obligatoria"),
  topK: z.number().int().min(1).max(15).optional()
});

export type AskQuestionDTO = z.infer<typeof AskQuestionSchema>;

