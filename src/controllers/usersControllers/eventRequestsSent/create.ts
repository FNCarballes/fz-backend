// src/controllers/usersControllers/eventRequestsSent/create.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { UserModel } from "../../../models/UserModel";
import {logger} from "../../../utils/logger/logger"

export const postEventRequestController = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId;
  const { requestId } = req.body;

  if (!userId || !requestId) {
    res.status(400).json({ error: "Falta el requestId o el token de usuario" });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    // Esto está perfecto. Buscás al usuario en la base antes de modificarlo.

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Evitar duplicados
    //Este método de JavaScript verifica si al menos un elemento del
    // arreglo cumple una condición.
    //Retorna true si encuentra uno que la cumpla.
    if (!user.eventRequestsSent.some((id) => id.toString() === requestId)) {
      user.eventRequestsSent.push(requestId);
      await user.save();
    }

    res.status(200).json({ message: "Solicitud de evento agregada" });
    return;
  } catch (error) {
    logger.error({error}, "❌ Error al agregar solicitud de evento:");
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
