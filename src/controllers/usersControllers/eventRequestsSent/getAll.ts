import { Response } from "express";
import { UserModel } from "../../../models/UserModel";
import { AuthRequest } from "../../../types/express";
import {logger} from "../../../utils/logger/logger"
 export const getEventRequestsSentController = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      res.status(400).json({ error: "userId es obligatorio" });
      return;
    }

    try {
      const user = await UserModel.findById(userId).populate(
        "eventRequestsSent",
        "eventId titleEvent status"
      );

      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      res.status(200).json({ eventRequestsSent: user.eventRequestsSent });
      return
    } catch (error) {
      logger.error({error},"❌ Error al obtener solicitudes de evento:");
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }