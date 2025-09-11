//userRoute.ts
import express from "express";
import { authMiddleware } from "../auth/middlewares/authMiddleware";
import "../dataStructure/mongooseModels/EventsModel"; // Importar solo para registrar el modelo
import { createUserController } from "../controllers/usersControllers/create";
import { validateParams, validate } from "../auth/Validate";
import { createUserSchema } from "../dataStructure/schemasZod/users/CreateUserSchema";
import { postEventRequestSentController } from "../controllers/usersControllers/eventRequestsSent/create";
import { userRequestSentSchema } from "../dataStructure/schemasZod/users/requestsSent/UserRequestsSentSchema";
import { getEventRequestsSentController } from "../controllers/usersControllers/eventRequestsSent/getAll";
import { deleteEventRequestSentController } from "../controllers/usersControllers/eventRequestsSent/deleteOne";
import { deleteRequestSentSchema } from "../dataStructure/schemasZod/users/requestsSent/DeleteRequestSentSchema";
import { limitCreateUser, limitEventRequestsSent } from "../auth/middlewares/rateLimiters";
const router = express.Router();
router.post("/", limitCreateUser,  validate(createUserSchema), createUserController);
router.post("/eventRequestsSent", authMiddleware, validate(userRequestSentSchema), limitEventRequestsSent, postEventRequestSentController);
router.get("/eventRequestsSent", authMiddleware, getEventRequestsSentController);
router.delete(
  "/eventRequestsSent/:requestId",
  authMiddleware,
  validateParams(deleteRequestSentSchema),
  deleteEventRequestSentController
);
export default router;
