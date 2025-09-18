import { Response, NextFunction } from "express";
import { EventRequestModel } from "../../dataStructure/mongooseModels/EventRequestModel";
import { AuthRequest } from "../../dataStructure/types/express/Index";
import mongoose from "mongoose";
import { sendResponse } from "../../utils/helpers/apiResponse";
interface GetStatusQuery {
  eventId?: string;
}

//trae el estado de la solicitud del usuario logueado (una sola).
//Para todos los usuarios
export const getStatusEventRequestController = async (
  req: AuthRequest<{}, {}, {}, GetStatusQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.query;
    const userId = req.userId; // obtenido del token

    if (!userId || !eventId) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Falta eventId en query o userId en token."
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "eventId inválido."
      });
      return;
  }
    const request = await EventRequestModel.findOne({ userId, eventId });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: request?.status ?? "none"
    });
    return;
  } catch (error) {
    next(error);
  }
};
