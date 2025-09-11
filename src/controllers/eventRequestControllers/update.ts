// src/controllers/eventRequestControllers/update.ts
import express, { Request, Response, NextFunction } from "express";
import { EventRequestModel } from "../../dataStructure/mongooseModels/EventRequestModel";
import { EventModel } from "../../dataStructure/mongooseModels/EventsModel";
import {
  UpdateEventRequestInput,
} from "../../dataStructure/schemasZod/eventsRequest/EventRequestSchema";
import {
  emitToCreator,
  emitToUser,
} from "../../sockets/forEventRequest/eventEmmiters";
import mongoose from "mongoose";
import { AuthRequest } from "../../dataStructure/types/express/Index";
import { sendResponse } from "../../utils/helpers/apiResponse";
export const patchEventRequestController = async (
  req: AuthRequest<{}, {}, UpdateEventRequestInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = (req as any).params;
    const { status } = req.body; // ✅ ya validado por Zod

    const userId = req.userId;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "requestId inválido."
      });
      return;
    }
    // 1. Buscar la solicitud para obtener el eventId
    const existingRequest = await EventRequestModel.findById(requestId);
    if (!existingRequest) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Solicitud no encontrada"
      });
      return;
    }

    // 2. Buscar el evento para verificar el creador
    const event = await EventModel.findById(existingRequest.eventId);
    if (!event) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Evento no encontrado"
      });
      return;
    }

    // 3. Verificar si el userId coincide con el creador
    if (!event.creator || event.creator.toString() !== userId) {
      sendResponse(res, {
        statusCode: 403,
        success: false,
        message: "No autorizado para modificar esta solicitud."
      });
      return;
    }


    const updated = await EventRequestModel.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    );

    if (!updated) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Solicitud no encontrada."
      });
      return;
    }

    const io = req.app.get("io");

    emitToCreator(updated.eventId.toString(), "request:updated", {
      requestId: updated._id,
      eventId: updated.eventId,
      userId: updated.userId,
      status: updated.status,
    });

    emitToUser(updated.userId.toString(), "request:statusChanged", {
      requestId: updated._id,
      eventId: updated.eventId,
      status: updated.status,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: updated
    });
    return;
  } catch (error) {
    next(error);
  }
};
