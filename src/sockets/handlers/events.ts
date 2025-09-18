// // Crear/actualizar eventos, unirse, cancelar.

// // Usar rooms event:{eventId} para broadcasts de estado.

// // Validar permisos (owner, organizer).

// // Emitir a participantes y notificar interesados.

// // src/sockets/handlers/events.ts
// import { Server } from "socket.io";
// import { z } from "zod";
// import { AppSocket, EVENTS } from "../middlewaresSockets/types";
// import { safeHandler } from "../indexSocket";
// import {createEvent, joinEvent, leaveEvent} from "../../routes/services/eventService";
// import NotificationService from "../../services/notificationService";

// const CreateEventSchema = z.object({
//   title: z.string().min(3),
//   when: z.string(), // ISO
//   capacity: z.number().int().optional(),
// });

// export function registerEventHandlers(socket: AppSocket, io: Server) {
//   // create event
//   socket.on(
//     EVENTS.EVENTS.CREATE,
//     safeHandler(async (sock, raw, ack?: Function) => {
//       const data = CreateEventSchema.parse(raw);
//       // permiso: check role
//       const event = await createEvent({
//         ...data,
//         ownerId: sock.data.user.userId,
//       });
//       // owner se une automáticamente a room del evento
//       sock.join(`event:${event.id}`);
//       // emitir a usuarios interesados (ej. seguidores) -- ejemplo
//       io.emit("events:new", { event });
//       if (typeof ack === "function") ack({ ok: true, event });
//     })
//   );

//   // join event
//   socket.on(
//     EVENTS.EVENTS.JOIN,
//     safeHandler(async (sock, raw, ack?: Function) => {
//       const { eventId } = z.object({ eventId: z.string() }).parse(raw);
//       // check capacity / permisos / pagos
//       const joined = await EventService.addAttendee(eventId, sock.data.user.userId);
//       // agregar a room y notificar asistentes
//       socket.join(`event:${eventId}`);
//       io.to(`event:${eventId}`).emit(EVENTS.EVENTS.ATTENDEE_JOINED, {
//         userId: sock.data.user.userId,
//       });
//       // notificar owner
//       notifyOwner(eventId, { type: "attendee_joined", userId: sock.data.user.userId });
//       if (typeof ack === "function") ack({ ok: true, joined });
//     })
//   );

//   // cancel event (owner only)
//   socket.on(
//     EVENTS.EVENTS.CANCEL,
//     safeHandler(async (sock, raw, ack?: Function) => {
//       const { eventId } = z.object({ eventId: z.string() }).parse(raw);
//       const isOwner = await EventService.isOwner(eventId, sock.data.user.userId);
//       if (!isOwner) return ack?.({ ok: false, code: "NO_PERM", message: "No sos owner" });
//       await EventService.cancel(eventId);
//       io.to(`event:${eventId}`).emit("events:cancelled", { eventId });
//       if (typeof ack === "function") ack({ ok: true });
//     })
//   );
// }

// async function notifyOwner(eventId: string, payload: any) {
//   // ejemplo de obtener owner y usar NotificationService
//   const ownerId = await EventService.getOwner(eventId);
//   await NotificationService.create(ownerId, payload);
// }