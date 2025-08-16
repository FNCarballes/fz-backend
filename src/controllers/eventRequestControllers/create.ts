// src/controllers/EventRequestController.ts
import { EventRequestModel } from "../../models/EventRequestModel";
import { AuthRequest } from "../../types/express";
import { CreateEventRequestInput } from "../../models/schemasZod/eventsRequest/EventRequestSchema";
import mongoose from "mongoose";
import { Response, NextFunction } from "express";
import {logger} from "../../utils/logger/logger"
export const postEventRequestController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId; // ya tipado en AuthRequest

    const { eventId } = req.body as CreateEventRequestInput;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ message: "eventId inválido." });
      return;
    }

    const existing = await EventRequestModel.findOne({ userId, eventId });
    if (existing) {
      res
        .status(409)
        .json({ message: "Ya existe una solicitud para este evento." });
      return;
    }

    const request = new EventRequestModel({ userId, eventId });
    const requestSaved = await request.save();

    // 1. Accedé a io
    const io = req.app.get("io");

    // 2. Traé el evento y su creador
    const event = await mongoose
      .model("Event")
      .findById(eventId)
      .populate("creator");

    if (event && event.creator) {
      const creatorId = event.creator._id.toString();

      // 3. Emití a la room del creador
      io.to(creatorId).emit("request:created", {
        eventId,
        requestId: requestSaved._id,
        userId,
      });
      logger.info(`📢 request:created emitido a ${creatorId}`);
    }

    res.status(201).json({ id: requestSaved._id });
  } catch (error) {
    next(error);
  }
};
