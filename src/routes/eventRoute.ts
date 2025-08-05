// routes/eventRoute.ts
import { Router} from "express";
import { authMiddleware } from "../auth/middlewares/authMiddleware";
import type { IEvent } from "../models/Events";
import {
  createEventSchema,
} from "../models/schemas/CreateEventSchema";
import { validate } from "../auth/Validate";
import {createEventController} from "../controllers/eventsControllers/create";
import { updateEventController } from "../controllers/eventsControllers/update";
import { deleteEventController } from "../controllers/eventsControllers/delete";
import { getAllEventsController } from "../controllers/eventsControllers/getAll";
import { validateQuery } from "../auth/middlewares/validateQuery";
import { eventQuerySchema } from "../models/schemas/eventQuerySchema";
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
// export function cleanEventDoc(doc: IEvent) {
//   const ev = doc.toObject(); // o doc.toJSON()

//   return {
//     _id: ev._id,
//     titleEvent: ev.titleEvent,
//     publicDescription: ev.publicDescription,
//     privateDescription: ev.privateDescription,
//     date: ev.date,
//     image: ev.image,
//     location: ev.location,
//     creationDate: ev.creationDate,
//     creator: ev.creator,
//     isSolidary: ev.isSolidary,

//     // Como la virtual `participants` ya trae la subdocumento completo,
//     // aquí sólo extraemos userId:
//     participants: ev.participants?.map((p: any) => p.userId) || [],

//     // Y requests virtuales pasadas a tu forma:
//     requests:
//       ev.requests.map((r: any) => ({
//         requestId: r._id,
//         status: r.status,
//         user: r.userId,
//       })) || [],
//   };
// }

// function parseBooleanQuery(value: any): boolean | undefined {
//   if (value === undefined) return undefined;
//   const v = String(value).toLowerCase().trim();
//   if (v === "true") return true;
//   if (v === "false") return false;
//   return undefined; // o lanzar error de validación
// }

router.post(
  "/",
  authMiddleware,
  validate(createEventSchema),
  createEventController,
);
//  async (req, res, next) => {
  //   try {
  //     // Ahora TS sabe que req.body coincide con CreateEventInput
  //     const input = req.body as CreateEventInput;
  //     const {
  //       titleEvent,
  //       publicDescription,
  //       privateDescription,
  //       date,
  //       image,
  //       location,
  //       isSolidary,
  //     } = input;
  //     const userId = (req as any).userId;
  //     const newEvent = new EventModel({
  //       titleEvent,
  //       publicDescription,
  //       privateDescription,
  //       date,
  //       image,
  //       location,
  //       creator: userId, // Asegúrate de que el creador se envíe en el cuerpo de la solicitud
  //       creationDate: new Date(), // Fecha de creación del evento
  //       isSolidary: isSolidary || false, // Campo opcional para eventos solidarios
  //     });
  //     const saved = await newEvent.save();
  //     const io = req.app.get("io") as SocketIOServer;
  //     io.emit("event:created", cleanEventDoc(saved));
  //     res.status(201).json({ id: saved._id });
  //   } catch (err) {
  //     next(err);
  //   }
  // }

// GET /api/events?isSolidary=true|false
router.get(
  "/",
  validateQuery(eventQuerySchema),
  getAllEventsController
);

// PATCH /api/events/:id
router.patch(
  "/:id",
  authMiddleware,
  validate(createEventSchema),
 updateEventController
);

//  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // try {
      // const { id } = req.params;
      // const userId = (req as any).userId;
// 
      // const event = await EventModel.findById(id);
      // if (!event) {
        // res.status(404).json({ error: "Evento no encontrado" });
        // return;
      // }
// 
      // if (event.creator.toString() !== userId) {
        // res.status(403).json({ error: "No autorizado" });
        // return;
      // }
// 
      // Autorizado => actualizar campos
      // Object.assign(event, req.body);
      // const updated = await event.save();
// 
      // const io = req.app.get("io") as SocketIOServer;
      // io.emit("event:updated", cleanEventDoc(updated));
// 
      // res.json(cleanEventDoc(updated));
    // } catch (err) {
      // next(err);
    // }
  // }

// DELETE /api/events/:id
router.delete(
  "/:id",
  authMiddleware,
  deleteEventController
);

export default router;
