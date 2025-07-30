import express, { Request, Response, NextFunction } from "express";
import { EventRequestModel } from "../models/EventRequest";
import mongoose from "mongoose";
import { authMiddleware } from "../auth/authMiddleware";
import { AuthRequest } from "../types/express";
import {
  emitToCreator,
  emitToUser,
} from "../sockets/forEventRequest/eventEmmiters";
const router = express.Router();

interface GetStatusQuery {
  userId?: string;
  eventId?: string;
}

interface UpdateRequestBody {
  status: "accepted" | "rejected";
}

// Crear nueva solicitud
router.post(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
      const userId = (req as any).userId; // ✅ obtenido del token

      const { eventId } = req.body;

      if (!userId || !eventId) {
        return res
          .status(400)
          .json({ message: "userId y eventId son requeridos." });
      }

      const existing = await EventRequestModel.findOne({ userId, eventId });
      if (existing) {
        return res
          .status(409)
          .json({ message: "Ya existe una solicitud para este evento." });
      }

      const request = new EventRequestModel({ userId, eventId });
      const requestSaved = await request.save();

      // 1. Accedé a io
      const io = req.app.get("io");

      // 2. Traé el evento y su creador
      const event = await mongoose
        .model("Event")
        .findById(eventId)
        .populate("creator");

      if (event && event.creator) {
        const creatorId = event.creator._id.toString();

        // 3. Emití a la room del creador
        io.to(creatorId).emit("request:created", {
          eventId,
          requestId: requestSaved._id,
          userId,
        });
        console.log(`📢 request:created emitido a ${creatorId}`);
      }

      return res.status(201).json({ id: requestSaved._id });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = (req as any).userId;
    const eventId = req.query.eventId as string;

    if (!userId || !eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      res
        .status(400)
        .json({ message: "userId y eventId válidos son requeridos." });
      return;
    }

    try {
      const requests = await EventRequestModel.find({ eventId }).populate(
        "userId",
        "name surname email"
      );
      res.json(requests);
    } catch (error) {
      console.error("❌ Error al obtener solicitudes de evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);
// Ver estado de solicitud
router.get(
  "/status",
  authMiddleware,
  async (
    req: Request<{}, {}, {}, GetStatusQuery>,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      const { eventId } = req.query;
      const userId = (req as any).userId; // ✅ obtenido del token

      if (!userId || !eventId) {
        return res
          .status(400)
          .json({ message: "userId y eventId son requeridos en query." });
      }

      const request = await EventRequestModel.findOne({ userId, eventId });

      return res.json({ status: request?.status ?? "none" });
    } catch (error) {
      next(error);
    }
  }
);

// Aceptar o rechazar solicitud
router.patch(
  "/:requestId",
  authMiddleware,
  async (
    req: Request<{ requestId: string }, {}, UpdateRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      const { requestId } = req.params;
      const { status } = req.body;

      if (!["accepted", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({ message: 'Estado inválido. Use "accepted" o "rejected".' });
      }

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ message: "ID de solicitud inválido." });
      }

      const updated = await EventRequestModel.findByIdAndUpdate(
        requestId,
        { status },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "Solicitud no encontrada." });
      }
      const io = req.app.get("io");

      await emitToCreator(io, updated.eventId.toString(), "request:updated", {
        requestId: updated._id,
        eventId: updated.eventId,
        userId: updated.userId,
        status: updated.status,
      });

      await emitToUser(io, updated.userId.toString(), "request:statusChanged", {
        requestId: updated._id,
        eventId: updated.eventId,
        status: updated.status,
      });

      return res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// Eliminar solicitud
router.delete(
  "/:requestId",
  authMiddleware,
  async (
    req: Request<{ requestId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      const { requestId } = req.params;
      const userId = (req as AuthRequest).userId; // ✅ obtenido del token
      if (!userId) {
        return res
          .status(400)
          .json({ message: "Token (userId) es requerido." });
      }
      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ message: "ID inválido." });
      }

      const deleted = await EventRequestModel.findByIdAndDelete(requestId);
      if (!deleted) {
        return res.status(404).json({ message: "Solicitud no encontrada." });
      }
    
      const io = req.app.get("io");

      await emitToCreator(io, deleted.eventId.toString(), "request:deleted", {
        requestId: deleted._id,
        eventId: deleted.eventId,
        userId: deleted.userId,
        status: deleted.status,
      });
     res.status(200).json({ message: "OK!" })
     return;
    } catch (error) {
      next(error);
    }
  }
);

export default router;
