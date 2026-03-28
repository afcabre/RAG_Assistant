import cors from "cors";
import express, { Express } from "express";
import { ChatController } from "./controllers/ChatController";
import { DocumentController } from "./controllers/DocumentController";
import { errorHandler } from "./middlewares/errorHandler";
import { buildChatRoutes } from "./routes/chatRoutes";
import { buildDocumentRoutes } from "./routes/documentRoutes";

export const createApp = (params: { documentController: DocumentController; chatController: ChatController }): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok"
    });
  });

  app.use("/api/documents", buildDocumentRoutes(params.documentController));
  app.use("/api/chat", buildChatRoutes(params.chatController));
  app.use(errorHandler);

  return app;
};

