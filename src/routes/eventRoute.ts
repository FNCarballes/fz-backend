// routes/eventRoute.ts
import { Router} from "express";
import { authMiddleware } from "../auth/middlewares/authMiddleware";
import type { IEvent } from "../models/Events";
import {
  createEventSchema,
} from "../models/schemasZod/events/CreateEventSchema";
import { validate } from "../auth/Validate";
import {createEventController} from "../controllers/eventsControllers/create";
import { updateEventController } from "../controllers/eventsControllers/update";
import { deleteEventController } from "../controllers/eventsControllers/delete";
import { getAllEventsController } from "../controllers/eventsControllers/getAll";
import { validateQuery } from "../auth/middlewares/validateQuery";
import { eventQuerySchema } from "../models/schemasZod/events/eventQuerySchema";
const router = Router();

router.post(
  "/",
  authMiddleware,
  validate(createEventSchema),
  createEventController,
);
// GET /api/events?isSolidary=true|false
router.get(
  "/",
  validateQuery(eventQuerySchema),
  getAllEventsController
);
// PATCH /api/events/:id
router.patch(
  "/:id",
  authMiddleware,
  validate(createEventSchema),
 updateEventController
);
// DELETE /api/events/:id
router.delete(
  "/:id",
  authMiddleware,
  deleteEventController
);

export default router;
