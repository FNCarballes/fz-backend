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
    participants: ev.participants.map((p: any) => p.userId),

    // Y requests virtuales pasadas a tu forma:
    requests: ev.requests.map((r: any) => ({
      requestId: r._id,
      status: r.status,
      user: r.userId,
    })),
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateFields = { ...req.body };
      const updated = await EventModel.findByIdAndUpdate(id, updateFields, {
        new: true,
      });
      if (!updated) {
        res.status(404).json({ error: "Evento no encontrado" });
        return;
      }

      const io: SocketIOServer = req.app.io;
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
      const io: SocketIOServer = req.app.io;
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
      const event = await EventModel.findById(id);
      if (!event)
        return res.status(404).json({ error: "Evento no encontrado" });

      await event.deleteOne();

      const io: SocketIOServer = req.app.io;
      io.emit("event:deleted", { id });

      res.json({ message: "Evento eliminado correctamente" });
    } catch (err) {
      next(err);
    }
  }
);
export default router;
// interface PopulatedParticipant {
//   userId: {
//     _id: string;
//     name: string;
//     surname: string;
//     email: string;
//   };
// }

// interface PopulatedEvent extends Document {
//   _id: string;
//   titleEvent: string;
//   publicDescription: string;
//   privateDescription: string;
//   date: string;
//   location: string;
//   creationDate: Date;
//   creator: {
//     _id: string;
//     name: string;
//     surname: string;
//     email: string;
//     age: number;
//     location: string;
//     identify: string;
//   };
//   participants: PopulatedParticipant[];
// }

// router.get("/events", async (req: Request, res: Response) => {
//   try {

//     const { isSolidary } = req.query;

//     // Construir query dinámicamente si se pasa el filtro
//     const query: any = {};
//     if (isSolidary !== undefined && typeof isSolidary === "string" ) {
//       query.isSolidary = isSolidary === "true";
//     }

//     const events = await EventModel
//       .find(query)
//       .sort({ creationDate: -1 })
//       .populate("creator", "-password -__v")
//       .populate({
//         path: "participants",
//         select: "userId status",
//         populate: { path: "userId", model: "User", select: "name email surname age location identify" }
//       })
//       .populate({
//         path: "requests",
//         select: "userId status _id",
//         populate: { path: "userId", model: "User", select: "name email surname" }
//       });

//     const cleanEvents = (events as any[]).map(event => {
//       const ev = event.toObject();
//       return {
//         ...ev,
//         participants: ev.participants.map((p: any) => p.userId),
//           isSolidary: ev.isSolidary, // 👈 Asegurate de que esté presente explícitamente
//         requests:     ev.requests.map((r: any) => ({
//           requestId: r._id,
//           status:    r.status,
//           user:      r.userId
//         }))
//       };
//     });

//     res.status(200).json(cleanEvents);
//   } catch (err) {
//     console.error("❌ Error al obtener eventos:", err);
//     res.status(500).json({ error: "Error al obtener eventos" });
//   }
// });

// router.delete(
//   "/events/:id",
//   authMiddleware,
//   async (req: Request, res: Response): Promise<any> => {
//     const { id } = req.params;
//     const userId = (req as any).userId;

//     try {
//       if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
//         return res.status(400).json({ error: "ID de evento inválido" });
//       }

//       const event = await EventModel.findById(id);

//       if (!event) {
//         return res.status(404).json({ error: "Evento no encontrado" });
//       }

//       if (event.creator.toString() !== userId) {
//         return res
//           .status(403)
//           .json({ error: "No tienes permiso para eliminar este evento" });
//       }

//       await event.deleteOne();
//       res.status(200).json({ message: "Evento eliminado correctamente" });
//     } catch (error) {
//       console.error("❌ Error al eliminar evento:", error);
//       return res.status(500).json({ error: "Error al eliminar evento" });
//     }
//   }
// );

// router.patch(
//   "/events/:id",
//   async (req: Request, res: Response): Promise<any> => {
//     const { id } = req.params;
//     const {
//       titleEvent,
//       publicDescription,
//       privateDescription,
//       date,
//       image,
//       location,
//     } = req.body;

//     if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
//       return res.status(400).json({ error: "ID de evento inválido" });
//     }

//     // if (date && isNaN(Date.parse(date))) {
//     //   return res.status(400).json({ error: "Fecha inválida" });
//     // }

//     const updateFields: any = {};
//     if (titleEvent !== undefined) updateFields.titleEvent = titleEvent;
//     if (publicDescription !== undefined)
//       updateFields.publicDescription = publicDescription;
//     if (privateDescription !== undefined)
//       updateFields.privateDescription = privateDescription;
//     if (date !== undefined) updateFields.date = date;
//     if (image !== undefined) updateFields.image = image;
//     if (location !== undefined) updateFields.location = location;

//     try {
//       const updatedEvent = await EventModel.findByIdAndUpdate(
//         id,
//         updateFields,
//         { new: true }
//       );

//       if (!updatedEvent) {
//         return res.status(404).json({ error: "Evento no encontrado" });
//       }

//       return res.status(200).json(updatedEvent);
//     } catch (error) {
//       console.error("❌ Error al actualizar evento:", error);
//       return res.status(500).json({ error: "Error al actualizar evento" });
//     }
//   }
// );
