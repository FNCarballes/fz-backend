// src/controllers/eventRequestControllers/delete.ts
import { EventRequestModel } from "../../models/EventRequest";
import { EventModel, IEvent } from "../../models/Events";
import { Response } from "express";
import { AuthRequest } from "../../types/express";
import { emitToCreator } from "../../sockets/forEventRequest/eventEmmiters";
import mongoose from "mongoose";
type DeleteParams = {
  requestId: string;
};
export const deleteEventRequestController = async (
  req: AuthRequest<DeleteParams>,
  res: Response
): Promise<void> => {
  const userId = req.userId; // ✅ viene del token por authMiddleware
  const { requestId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    res.status(400).json({ message: "requestId inválido." });
    return;
  }
  try {
    // 1. Verificamos si la solicitud existe
    const request = await EventRequestModel.findById(requestId);
    if (!request) {
      res.status(404).json({ message: "Solicitud no encontrada." });
      return;
    }

    // 2. Buscamos el evento para conocer su creador
    const event = await EventModel.findById<IEvent>(request.eventId);
    if (!event) {
      res.status(404).json({ message: "Evento no encontrado." });
      return;
    }

    // 3. Comprobamos autorización
    const isOwner = event.creator.toString() === userId;
    const isRequester = request.userId.toString() === userId;

    if (!isOwner && !isRequester) {
      res
        .status(403)
        .json({ message: "No autorizado para eliminar esta solicitud." });
      return;
    }

    // 4. Eliminamos la solicitud
    await request.deleteOne();

    // 5. Emitimos evento por sockets al creador
    const io = req.app.get("io");
    await emitToCreator(io, event._id.toString(), "request:deleted", {
      requestId,
      eventId: event._id,
      userId: request.userId,
      status: request.status,
    });

    res.status(204).send(); // ✅ Todo ok, sin contenido
  } catch (error) {
    console.error("❌ Error al eliminar solicitud:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};
