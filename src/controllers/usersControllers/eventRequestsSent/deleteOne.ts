// src/controllers/usersControllers/eventRequestsSent/deleteOne.ts
import { Request, Response } from "express";
import { UserModel } from "../../../dataStructure/mongooseModels/UserModel";
import { logger } from "../../../utils/logger/logger";

type DeleteUserParams = {
  requestId: string;
};

export const deleteEventRequestSentController = async (
  req: Request<DeleteUserParams>,
  res: Response
): Promise<void> => {
  const userId = (req as any).userId;
  const { requestId } = req.params;

  if (!userId || !requestId) {
    res.status(400).json({ error: "userId y requestId son obligatorios" });
    return;
  }


  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Verificamos si realmente existe en el array
    const exists = user.eventRequestsSent.some(
      (id) => id.toString() === requestId
    );

    if (!exists) {
      res.status(404).json({ error: "Solicitud no encontrada en el usuario" });
      return;
    }

    user.eventRequestsSent = user.eventRequestsSent.filter(
      (id) => id.toString() !== requestId
    );
    await user.save();

    res.status(200).json({ message: "Solicitud de evento eliminada" });
  } catch (error) {
    logger.error({ error }, "❌ Error al eliminar solicitud de evento:");
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
