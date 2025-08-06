// src/controllers/usersControllers/eventRequestsSent/deleteOne.ts
import {  Response } from "express";
import { AuthRequest } from "../../../types/express";  
import { UserModel } from "../../../models/UserModel";

type DeleteUserParams = {
  eventId: string;
};

// Controlador para eliminar una solicitud de evento
  export const deleteEventRequestSentController = async (req: AuthRequest<DeleteUserParams>, res: Response): Promise<void> => {
    const userId = req.userId;
    const { eventId } = req.params;

    if (!userId || !eventId) {
      res.status(400).json({ error: "userId y eventId son obligatorios" });
      return;
    }

    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      user.eventRequestsSent = user.eventRequestsSent.filter(
        (id) => id.toString() !== eventId
      );
      await user.save();

      res.status(200).json({ message: "Solicitud de evento eliminada" });
    } catch (error) {
      console.error("❌ Error al eliminar solicitud de evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }