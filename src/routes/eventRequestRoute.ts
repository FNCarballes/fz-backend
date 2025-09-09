import express from "express";
import { authMiddleware } from "../auth/middlewares/authMiddleware";
import {
  createEventRequestSchema,
  updateEventRequestSchema,
  deleteEventRequestSchema,
  getEventRequestsQuerySchema,
  requestIdParamSchema2,
  requestIdParamsSchema
} from "../models/schemasZod/eventsRequest/EventRequestSchema";
import { validate, validateQuery, validateParams } from "../auth/Validate";
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
type GetRequestQuery = {
  eventId: string;
};
const router = express.Router();
// Crear nueva solicitud
router.post(
  "/",
  authMiddleware,
  validate(createEventRequestSchema),
  limitPostEventRequest,
  postEventRequestController
);
router.get("/", authMiddleware,validateQuery(getEventRequestsQuerySchema), getEventRequestsController)
// Ver estado de solicitud
router.get("/status", authMiddleware, (req, res, next) => getStatusEventRequestController(req as AuthRequest, res, next));
// Aceptar o rechazar solicitud
router.patch(
  "/:requestId",
  authMiddleware,
  validateParams(requestIdParamsSchema),
  validate(updateEventRequestSchema),
  limitPatchEventRequest, patchEventRequestController);
// Eliminar solicitud
router.delete(
  "/:requestId",
  authMiddleware,
  validateParams(deleteEventRequestSchema),
  deleteEventRequestController
);
export default router;
