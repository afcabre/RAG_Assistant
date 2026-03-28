import { ErrorRequestHandler } from "express";
import { HttpError } from "../../shared/HttpError";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : "Error interno del servidor";
  res.status(500).json({ message });
};

