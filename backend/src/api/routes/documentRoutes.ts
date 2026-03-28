import { Router } from "express";
import multer from "multer";
import { DocumentController } from "../controllers/DocumentController";

export const buildDocumentRoutes = (controller: DocumentController): Router => {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024
    }
  });

  router.post("/upload", upload.single("file"), controller.uploadPdf);

  return router;
};

