// src/controllers/eventRequestControllers/delete.ts
import { EventRequestModel } from "../../dataStructure/mongooseModels/EventRequestModel";
import { EventModel, IEvent } from "../../dataStructure/mongooseModels/EventsModel";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../dataStructure/types/express/Index";
import { emitToCreator } from "../../sockets/forEventRequest/eventEmmiters";
import mongoose from "mongoose";
import { logger } from "../../utils/logger/logger"
import { sendResponse } from "../../utils/helpers/apiResponse";
type DeleteParams = {
  requestId: string;
};
export const deleteEventRequestController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.userId; // ✅ viene del token por authMiddleware
  const { requestId } = (req as any).params;
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "requestId inválido."
    });
    return;
  }
  try {
    // 1. Verificamos si la solicitud existe
    const request = await EventRequestModel.findById(requestId);
    if (!request) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Solicitud no encontrada."
      });
      return;
    }

    // 2. Buscamos el evento para conocer su creador
    const event = await EventModel.findById<IEvent>(request.eventId);
    if (!event) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Evento no encontrado"
      });
      return;
    }

    // 3. Comprobamos autorización
    const isOwner = event.creator.toString() === userId;
    const isRequester = request.userId.toString() === userId;

    if (!isOwner && !isRequester) {
      sendResponse(res, {
        statusCode: 403,
        success: false,
        message: "No autorizado para eliminar esta solicitud."
      });
      return;
    }

    // 4. Eliminamos la solicitud
    await request.deleteOne();

    // 5. Emitimos evento por sockets al creador
    const io = req.app.get("io");
    await emitToCreator(event._id.toString(), "request:deleted", {
      requestId,
      eventId: event._id,
      userId: request.userId,
      status: request.status,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
    });
    return;
  } catch (error) {
    next(error)
  }
};
