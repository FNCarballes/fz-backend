// routes/eventRput.ts
import express, { Router, Request, Response, NextFunction } from "express";
import { EventModel } from "../models/Events";
import { authMiddleware } from "../auth/authMiddleware";
import { Server as SocketIOServer } from "socket.io";
import type { IEvent } from "../models/Events";
import {
  createEventSchema,
  CreateEventInput,
} from "../models/CreateEventSchema";
import { validate } from "../auth/Validate";

const router = Router();

//Usar un Router limpio, sin lógica de Socket.IO embebida.

// Obtener io desde req.app.io dentro de cada handler.
//
// Emitir eventos tras crear, actualizar o eliminar.
//
// Usar async/await con try/catch y delegar errores a tu middleware global.
//
// Mantener la transformación “cleanEvents” para uniformidad de la respuesta.

// Helper para limpiar eventos
// cleanEventDoc
// Aísla la lógica de “transformar” los documentos de Mongo a tu forma de JSON, incluyendo isSolidary.
export function cleanEventDoc(doc: IEvent) {
  const ev = doc.toObject(); // o doc.toJSON()

  return {
    _id: ev._id,
    titleEvent: ev.titleEvent,
    publicDescription: ev.publicDescription,
    privateDescription: ev.privateDescription,
    date: ev.date,
    image: ev.image,
    location: ev.location,
    creationDate: ev.creationDate,
    creator: ev.creator,
    isSolidary: ev.isSolidary,

    // Como la virtual `participants` ya trae la subdocumento completo,
    // aquí sólo extraemos userId:
    participants: ev.participants?.map((p: any) => p.userId) || [],

    // Y requests virtuales pasadas a tu forma:
    requests:
      ev.requests.map((r: any) => ({
        requestId: r._id,
        status: r.status,
        user: r.userId,
      })) || [],
  };
}

function parseBooleanQuery(value: any): boolean | undefined {
  if (value === undefined) return undefined;
  const v = String(value).toLowerCase().trim();
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined; // o lanzar error de validación
}

// GET /api/events?isSolidary=true|false
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) Filtrado booleano
    const isSolidary = parseBooleanQuery(req.query.isSolidary);
    const query: any = {};
    if (typeof isSolidary === "boolean") {
      query.isSolidary = isSolidary;
    }

    // 2) Paginación
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    // 3) Conteo total
    const total = await EventModel.countDocuments(query);

    // 4) Consulta con skip/limit
    const events = await EventModel.find(query)
      .sort({ creationDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("creator", "-password -__v")
      .populate({
        path: "participants",
        select: "userId status",
        populate: {
          path: "userId",
          model: "User",
          select: "name email surname age location identify",
        },
      })
      .populate({
        path: "requests",
        select: "userId status _id",
        populate: {
          path: "userId",
          model: "User",
          select: "name email surname",
        },
      });

    // 5) Devolver datos + metadata
    res.json({
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: events.map(cleanEventDoc),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/events/:id
router.patch(
  "/:id",
  authMiddleware,
  validate(createEventSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
);



router.post(
  "/",
  authMiddleware,
  validate(createEventSchema),
  async (req, res, next) => {
    try {
      // Ahora TS sabe que req.body coincide con CreateEventInput
      const input = req.body as CreateEventInput;
      const {
        titleEvent,
        publicDescription,
        privateDescription,
        date,
        image,
        location,
        isSolidary,
      } = input;
      const userId = (req as any).userId;
      const newEvent = new EventModel({
        titleEvent,
        publicDescription,
        privateDescription,
        date,
        image,
        location,
        creator: userId, // Asegúrate de que el creador se envíe en el cuerpo de la solicitud
        creationDate: new Date(), // Fecha de creación del evento
        isSolidary: isSolidary || false, // Campo opcional para eventos solidarios
      });
      const saved = await newEvent.save();
      const io = req.app.get("io") as SocketIOServer;
      io.emit("event:created", cleanEventDoc(saved));
      res.status(201).json({ id: saved._id });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/events/:id
router.delete(
  "/:id",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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
);

export default router;
