import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { EventModel } from "../../models/Events";

export const deleteEventController =   async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const event = await EventModel.findById(id);
      if (!event) {
        return res.status(404).json({ error: "Evento no encontrado" });
      }

      if (event.creator.toString() !== userId) {
        return res.status(403).json({ error: "No autorizado" });
      }

      await event.deleteOne();

      const io = req.app.get("io") as SocketIOServer;
      io.emit("event:deleted", { id });

      res.json({ message: "Evento eliminado correctamente" });
    } catch (err) {
      next(err);
    }
  }