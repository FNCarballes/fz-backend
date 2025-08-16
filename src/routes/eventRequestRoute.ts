import express from "express";
import { authMiddleware } from "../auth/middlewares/authMiddleware";
import {
  createEventRequestSchema,
  updateEventRequestSchema,
  deleteEventRequestSchema,
} from "../models/schemasZod/eventsRequest/EventRequestSchema";
import { validate } from "../auth/Validate";
import { validateParams } from "../auth/Validate";
import { postEventRequestController } from "../controllers/eventRequestControllers/create";
import { getEventRequestsController } from "../controllers/eventRequestControllers/getAll";
import { getStatusEventRequestController } from "../controllers/eventRequestControllers/getStatus";
import { patchEventRequestController } from "../controllers/eventRequestControllers/update";
import { deleteEventRequestController } from "../controllers/eventRequestControllers/delete";
import {
  limitPostEventRequest,
  limitPatchEventRequest,
} from "../auth/middlewares/rateLimiters";
import { AuthRequest } from "../types/express";
const router = express.Router();
// Crear nueva solicitud
router.post(
  "/",
  authMiddleware,
  limitPostEventRequest,
  validate(createEventRequestSchema),
  (req, res, next) => postEventRequestController(req as AuthRequest, res, next)
);
router.get("/", authMiddleware,   (req, res) => getEventRequestsController(req as AuthRequest, res));
// Ver estado de solicitud
router.get("/status", authMiddleware, (req, res, next) => getStatusEventRequestController(req as AuthRequest, res, next));
// Aceptar o rechazar solicitud
router.patch(
  "/:requestId",
  authMiddleware,
  limitPatchEventRequest,
  validate(updateEventRequestSchema), // ← ¡Acá entra Zod!
  (req, res, next) =>patchEventRequestController(req as AuthRequest, res, next)
);
// Eliminar solicitud
router.delete(
  "/:requestId",
  authMiddleware,
  validateParams(deleteEventRequestSchema),
  (req, res) =>deleteEventRequestController(req as AuthRequest, res)
);
export default router;
