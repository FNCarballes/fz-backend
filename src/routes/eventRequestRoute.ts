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
const router = express.Router();
// Crear nueva solicitud
router.post(
  "/",
  authMiddleware,
  limitPostEventRequest,
  validate(createEventRequestSchema),
  postEventRequestController
);
router.get("/", authMiddleware, getEventRequestsController);
// Ver estado de solicitud
router.get("/status", authMiddleware, getStatusEventRequestController);
// Aceptar o rechazar solicitud
router.patch(
  "/:requestId",
  authMiddleware,
  limitPatchEventRequest,
  validate(updateEventRequestSchema), // ← ¡Acá entra Zod!
  patchEventRequestController
);
// Eliminar solicitud
router.delete(
  "/:requestId",
  authMiddleware,
  validateParams(deleteEventRequestSchema),
  deleteEventRequestController
);
export default router;
