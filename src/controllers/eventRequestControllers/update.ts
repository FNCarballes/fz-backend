// src/controllers/eventRequestControllers/update.ts
import express, { Request, Response, NextFunction } from "express";
import { EventRequestModel } from "../../models/EventRequestModel";
import { EventModel } from "../../models/EventsModel";
import {
  UpdateEventRequestInput,
} from "../../models/schemasZod/eventsRequest/EventRequestSchema";
import {
  emitToCreator,
  emitToUser,
} from "../../sockets/forEventRequest/eventEmmiters";
import mongoose from "mongoose";
import { AuthRequest } from "../../types/express";
export const patchEventRequestController = async (
  req: AuthRequest<{ requestId: string }, {}, UpdateEventRequestInput>,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // ✅ ya validado por Zod

    const userId = req.userId;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "requestId inválido." });
    }
    // 1. Buscar la solicitud para obtener el eventId
    const existingRequest = await EventRequestModel.findById(requestId);
    if (!existingRequest) {
      return res.status(404).json({ message: "Solicitud no encontrada." });
    }

    // 2. Buscar el evento para verificar el creador
    const event = await EventModel.findById(existingRequest.eventId);
    if (!event) {
      return res.status(404).json({ message: "Evento no encontrado." });
    }

    // 3. Verificar si el userId coincide con el creador
    if (event.creator.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "No autorizado para modificar esta solicitud." });
    }

    const updated = await EventRequestModel.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Solicitud no encontrada." });
    }

    const io = req.app.get("io");

    emitToCreator(io, updated.eventId.toString(), "request:updated", {
      requestId: updated._id,
      eventId: updated.eventId,
      userId: updated.userId,
      status: updated.status,
    });

    emitToUser(io, updated.userId.toString(), "request:statusChanged", {
      requestId: updated._id,
      eventId: updated.eventId,
      status: updated.status,
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
};
