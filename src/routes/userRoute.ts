//userRoute.ts
import express from "express";
import { authMiddleware } from "../auth/middlewares/authMiddleware";
import "../models/EventsModel"; // Importar solo para registrar el modelo
import { createUserController } from "../controllers/usersControllers/create";
import { validate } from "../auth/Validate";
import { createUserSchema } from "../models/schemasZod/users/createUserSchema";
import { postEventRequestController } from "../controllers/usersControllers/eventRequestsSent/create";
import { userRequestSentSchema } from "../models/schemasZod/users/requestsSent/userRequestsSentSchema";
import { getEventRequestsSentController } from "../controllers/usersControllers/eventRequestsSent/getAll";
import { deleteEventRequestSentController } from "../controllers/usersControllers/eventRequestsSent/deleteOne";
import { deleteRequestSentSchema } from "../models/schemasZod/users/requestsSent/deleteRequestSentSchema";
import { limitCreateUser, limitEventRequestsSent } from "../auth/middlewares/rateLimiters";
const router = express.Router();
router.post(
  "/users",
  limitCreateUser,
  validate(createUserSchema),
  createUserController
);
router.post(
  "/users/eventRequestsSent",
  authMiddleware,
  limitEventRequestsSent,
  validate(userRequestSentSchema),
  postEventRequestController
);
router.get(
  "/users/eventRequestsSent",
  authMiddleware,
  getEventRequestsSentController
);
router.delete(
  "/users/eventRequestsSent/:eventId",
  authMiddleware,
  validate(deleteRequestSentSchema),
  deleteEventRequestSentController
);
export default router;
