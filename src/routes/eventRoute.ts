// routes/eventRoute.ts
import { Router } from "express";
import { authMiddleware } from "../sockets/middlewaresSockets/authMiddleware";
import {
  createEventSchema,
} from "../dataStructure/schemasZod/events/CreateEventSchema";
import { updateEventSchema } from "../dataStructure/schemasZod/events/UpdateEventSchema";
import { validate } from "../auth/Validate";
import { createEventController } from "../controllers/eventsControllers/create";
import { updateEventController } from "../controllers/eventsControllers/update";
import { deleteEventController } from "../controllers/eventsControllers/delete";
import { getAllEventsController } from "../controllers/eventsControllers/getAll";
import { validateQuery } from "../auth/middlewares/validateQuery";
import { eventQuerySchema } from "../dataStructure/schemasZod/events/EventQuerySchema";
import { limitPostEventRequest, limitPatchEventRequest, limitGetEventRequest } from "../auth/middlewares/rateLimiters";
const router = Router();

router.post(
  "/",
  authMiddleware,
  validate(createEventSchema),
  limitPostEventRequest,
  createEventController,
);
// GET /api/events?isSolidary=true|false
router.get(
  "/",
  validateQuery(eventQuerySchema),
  limitGetEventRequest,
  getAllEventsController
);
// PATCH /api/events/:id
router.patch(
  "/:id",
  authMiddleware,
  validate(updateEventSchema),
  limitPatchEventRequest,
  updateEventController
);
// DELETE /api/events/:id
router.delete(
  "/:id",
  authMiddleware,
  deleteEventController
);

export default router;
