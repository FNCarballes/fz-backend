import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { EventModel } from "../../models/Events";
import { cleanEventDoc } from "../../utils/cleanEventDoc";


export const updateEventController =  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      // Autorizado => actualizar campos
      Object.assign(event, req.body);
      const updated = await event.save();

      const io = req.app.get("io") as SocketIOServer;
      io.emit("event:updated", cleanEventDoc(updated));

      res.json(cleanEventDoc(updated));
    } catch (err) {
      next(err);
    }
  }