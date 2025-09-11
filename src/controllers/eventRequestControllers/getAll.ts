import { AuthRequest } from "../../dataStructure/types/express/Index";
import mongoose, { Types } from "mongoose";
import { EventRequestModel } from "../../dataStructure/mongooseModels/EventRequestModel";
import { Response, NextFunction } from "express";
import { EventModel } from "../../dataStructure/mongooseModels/EventsModel";
import { logger } from "../../utils/logger/logger"
import { sendResponse } from "../../utils/helpers/apiResponse";
type GetRequestQuery = {
  eventId: string;
};
//trae todas las solicitudes de un evento. Lo usa solo el creador del evento
export const getEventRequestsController = async (
  req: AuthRequest<{}, {}, {}, GetRequestQuery>, res: Response, next: NextFunction
): Promise<void> => {
  const userId = req.userId;
  const validated = res.locals.validatedQuery as { eventId: string };
  const { eventId } = validated;
  if (!userId || !eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "userId y eventId válidos son requeridos."
    });
    return;
  }
  try {
    const event = await EventModel.findById(eventId).select("_id creator").lean();
    if (!event) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Evento no encontrado"
      });
      return;
    }
    if (String(event.creator) !== userId) {
      sendResponse(res, {
        statusCode: 403,
        success: false,
        message: "No autorizado para ver estas solicitudes."
      });
      return;
    }
    const requests = await EventRequestModel.find({
      eventId: new Types.ObjectId(eventId),
    })
      .select("_id userId status createdAt")                // ✅ proyección explícita
      .sort({ createdAt: -1 })
      .populate({ path: "userId", select: "name surname" })
      .lean();

    res.set("Cache-Control", "no-store");                  // ✅ no cachear
    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: requests
    });
  } catch (error) {
    next(error)
  }
};
