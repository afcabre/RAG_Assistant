import { Router } from "express";
import { ChatController } from "../controllers/ChatController";

export const buildChatRoutes = (controller: ChatController): Router => {
  const router = Router();
  router.post("/ask", controller.ask);
  return router;
};

