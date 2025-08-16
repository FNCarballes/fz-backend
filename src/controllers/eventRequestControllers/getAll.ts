import { AuthRequest } from "../../types/express";
import mongoose from "mongoose";
import { EventRequestModel } from "../../models/EventRequestModel";
import { Response } from "express";
import { EventModel } from "../../models/EventsModel";
import {logger} from "../../utils/logger/logger"
type GetRequestQuery = {
  eventId: string;
};  
//trae todas las solicitudes de un evento. Lo usa solo el creador del evento
export const getEventRequestsController = async (
  req: AuthRequest<{}, {}, {}, {}>, // tipa el cuarto genérico de AuthRequest, que es para Query.
  res: Response
): Promise<void> => {
  const userId = req.userId;
  const eventId = (req as any).query.eventId;

  if (!userId || !eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    res
      .status(400)
      .json({ message: "userId y eventId válidos son requeridos." });
    return;
  }

  try {

    const event = await EventModel.findById(eventId);
    if (!event) {
      res.status(404).json({ message: "Evento no encontrado." });
      return;
    }

    if (event.creator.toString() !== userId) {
      res.status(403).json({ message: "No estás autorizado a ver estas solicitudes." });
      return;
    }

    const requests = await EventRequestModel.find({ eventId })
      .sort({ createdAt: -1 })
      .populate("userId", "name surname email");
    res.json(requests);
  } catch (error) {
    logger.error({error}, "❌ Error al obtener solicitudes de evento:");
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
