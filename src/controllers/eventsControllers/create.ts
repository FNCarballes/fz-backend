// src/controllers/eventsControllers/create.ts
import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { EventModel } from "../../dataStructure/mongooseModels/EventsModel";
import { cleanEventDoc } from "../../utils/helpers/cleanEventDoc";
import { CreateEventInput } from "../../dataStructure/schemasZod/events/CreateEventSchema";
import { eventsCreated } from "../../utils/monitoring/prometheus";
import { sendResponse } from "../../utils/helpers/apiResponse";
import { notifyUser } from "../notificationsControllers/notificationController";
export const createEventController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ahora TS sabe que req.body coincide con CreateEventInput
    const input = req.body as CreateEventInput;
    const {
      titleEvent,
      publicDescription,
      privateDescription,
      date,
      image,
      location,
      isSolidary,
    } = input;
    const userId = (req as any).userId;
    if (!userId) {
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "No autenticado"
      });
      return;
    }
    const newEvent = new EventModel({
      titleEvent,
      publicDescription,
      privateDescription,
      date,
      image,
      location,
      creator: userId, // Asegúrate de que el creador se envíe en el cuerpo de la solicitud
      creationDate: new Date(), // Fecha de creación del evento
      isSolidary: isSolidary || false, // Campo opcional para eventos solidarios
    });
    const saved = await newEvent.save();
      const io = req.app.get("io") as SocketIOServer | undefined;
    if (io) io.emit("event:created", cleanEventDoc(saved)); // no llames a un singleton no inicializado
    eventsCreated.inc();
    sendResponse(res, {
      statusCode: 201,
      success: true,
      data: saved._id
    });
  } catch (err) {
    next(err);
  }
};
