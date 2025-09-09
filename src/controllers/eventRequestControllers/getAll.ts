import { AuthRequest } from "../../types/express";
import mongoose, { Types } from "mongoose";
import { EventRequestModel } from "../../models/EventRequestModel";
import { Response } from "express";
import { EventModel } from "../../models/EventsModel";
import { logger } from "../../utils/logger/logger"
type GetRequestQuery = {
  eventId: string;
};
//trae todas las solicitudes de un evento. Lo usa solo el creador del evento
export const getEventRequestsController = async (
  req: AuthRequest<{}, {}, {}, GetRequestQuery>, res: Response
): Promise<void> => {
  const userId = req.userId;
const validated = res.locals.validatedQuery as { eventId: string };
  const { eventId } = validated;
  if (!userId || !eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "userId y eventId válidos son requeridos." } });
    return;
  }

  try {

    const event = await EventModel.findById(eventId).select("_id creator").lean();
    if (!event) {
      res.status(404).json({ message: "Evento no encontrado." });
      return;
    }
    if (String(event.creator) !== userId) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "No estás autorizado a ver estas solicitudes." } });
      return;
    }
    const requests = await EventRequestModel.find({
      eventId: new Types.ObjectId(eventId),
    })
      .select("_id userId status createdAt")                // ✅ proyección explícita
      .sort({ createdAt: -1 })
      .populate({ path: "userId", select: "name email", options: { lean: true } })
      .lean();

    res.set("Cache-Control", "no-store");                  // ✅ no cachear
    res.json(requests);
  } catch (error) {
    // ✅ log con stack
    logger.error(error, "❌ Error al obtener solicitudes de evento");
    res.status(500).json({ error: { code: "INTERNAL", message: "Error interno del servidor" } });
  }
};
