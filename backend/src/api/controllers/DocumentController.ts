import { NextFunction, Request, Response } from "express";
import { UploadPdfUseCase } from "../../application/use-cases/UploadPdfUseCase";
import { HttpError } from "../../shared/HttpError";

export class DocumentController {
  constructor(private readonly uploadPdfUseCase: UploadPdfUseCase) {}

  uploadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;

      if (!file) {
        throw new HttpError(400, "Debes enviar un archivo PDF en el campo 'file'");
      }

      const isPdfByMime = file.mimetype === "application/pdf";
      const isPdfByName = file.originalname.toLowerCase().endsWith(".pdf");
      if (!isPdfByMime && !isPdfByName) {
        throw new HttpError(400, "El archivo debe ser un PDF");
      }

      const result = await this.uploadPdfUseCase.execute({
        fileName: file.originalname,
        buffer: file.buffer
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };
}

