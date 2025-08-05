import { Response, NextFunction } from "express";
import { EventRequestModel } from "../../models/EventRequest";
import { AuthRequest } from "../../types/express/index";
import mongoose from "mongoose";
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
      res.status(400).json({
        message: "eventId es requerido en query, userId desde token.",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
   res.status(400).json({ message: "eventId inválido." });
return
  }
    const request = await EventRequestModel.findOne({ userId, eventId });

    res.json({ status: request?.status ?? "none" });
  } catch (error) {
    next(error);
  }
};
