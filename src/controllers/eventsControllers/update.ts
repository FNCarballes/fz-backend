import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { EventModel } from "../../models/EventsModel";
import { cleanEventDoc } from "../../utils/cleanEventDoc";
import { AuthRequest } from "../../types/express/index";
import {updateEventSchema} from "../../models/schemasZod/events/UpdateEventSchema";
import {logger} from "../../utils/logger/logger"
export const updateEventController =  async (  req: Request<{ id: string }>,
 res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
  const userId = (req as any).userId;

      const event = await EventModel.findById(id);
      if (!event) {
        res.status(404).json({ error: "Evento no encontrado" });
        return;
      }

      if (event.creator.toString() !== userId) {
        res.status(403).json({ error: "No autorizado" });
        return;
      }

    // Validamos el body con Zod (esto lanza si hay error)
    const data = updateEventSchema.parse(req.body);

    // Aplicamos solo los campos válidos
    Object.assign(event, data);
    const updated = await event.save();

      const io = req.app.get("io") as SocketIOServer;
      io.emit("event:updated", cleanEventDoc(updated));

      res.json(cleanEventDoc(updated));
    } catch (err) {
      next(err);
    }
  }