import { NextFunction, Request, Response } from "express";
import { AskQuestionSchema } from "../../application/dto/AskQuestionDTO";
import { AskAssistantUseCase } from "../../application/use-cases/AskAssistantUseCase";
import { HttpError } from "../../shared/HttpError";

export class ChatController {
  constructor(private readonly askAssistantUseCase: AskAssistantUseCase) {}

  ask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = AskQuestionSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new HttpError(400, parseResult.error.errors[0]?.message ?? "Body invalido");
      }

      const result = await this.askAssistantUseCase.execute(parseResult.data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

