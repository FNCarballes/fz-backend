// src/controllers/eventsControllers/create.ts
import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { EventModel } from "../../models/EventsModel";
import { cleanEventDoc } from "../../utils/cleanEventDoc";
import { CreateEventInput } from "../../models/schemasZod/events/CreateEventSchema";
import { AuthRequest } from "../../types/express/index";
import { emitToAll } from "../../sockets/forEventRequest/eventEmmiters";
import {logger} from "../../utils/logger/logger"
export const createEventController = async (
  req: AuthRequest,
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
    const userId = req.userId;
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
    const io = req.app.get("io") as SocketIOServer;
    emitToAll(io, "event:created", cleanEventDoc(saved));

    res.status(201).json({ id: saved._id });
  } catch (err) {
    next(err);
  }
};
