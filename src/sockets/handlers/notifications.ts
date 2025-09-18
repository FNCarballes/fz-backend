// Subscribir usuario a su room personal (user:{id}) al conectar.

// Emitir notifs desde backend a la room del usuario.

// markAsRead y ack.

// No usar notifs en eventos de alta frecuencia — usar batching.

// src/sockets/handlers/notifications.ts
import { Server } from "socket.io";
import { z } from "zod";
import { AppSocket, EVENTS } from "../middlewaresSockets/types";
import { markAsRead, createNotification, getUserNotifications } from "../../routes/services/notificationService";
import { safeHandler } from "../middlewaresSockets/safeHandler";
import { NotificationModel, NotificationDoc } from "../../dataStructure/mongooseModels/NotificationModel";

// Schemas de validación
const MarkReadSchema = z.object({
  notificationId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId"),
});
const GetSchema = z.object({
  limit: z.number().min(1).max(50).default(20),
});

const NotifySchema = z.object({
  recipientId: z.string().regex(/^[a-f\d]{24}$/i),
  senderId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  type: z.enum(["EVENT_INVITE", "MESSAGE", "SYSTEM", "FRIEND_REQUEST", "OTHER"]),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  // data: z.record(z.any()).optional(),
});

export function registerNotificationHandlers(socket: AppSocket, io: Server) {
  const meRoom = `user:${socket.data.user.recipientId}`;
  socket.join(meRoom);

  // 📩 Marcar como leída
  socket.on(
    EVENTS.NOTIF.READ,
    safeHandler(socket, async (raw, ack?: Function) => {
      const { notificationId } = MarkReadSchema.parse(raw);
      const notif = await markAsRead(notificationId, socket.data.user.recipientId);

      if (typeof ack === "function") {
        ack({ success: true, data: notif });
      }
    })
  );
  // 📋 Obtener notificaciones
  socket.on(
    EVENTS.NOTIF.GET,
    safeHandler(socket, async (raw, ack?: Function) => {
      const { limit } = GetSchema.parse(raw || {});
      const notifs = await getUserNotifications(socket.data.user.recipientId, limit);

      if (typeof ack === "function") {
        ack({ success: true, data: notifs });
      }
    })
  );
}

// helper para notificar desde cualquier lado del backend
export async function notifyUser(io: Server, raw: {
  recipientId: string;
  senderId?: string;
  type: NotificationDoc["type"];
  title: string;
  message: string;
  data?: Record<string, any>;
}) {
  const params = NotifySchema.parse(raw);
  // 1. Persistir usando createNotification
  const notif = await createNotification(params);

  // 2. Emitir en tiempo real
  const room = `user:${params.recipientId}`;
  io.to(room).emit("NOTIF:NEW", notif, (ack: { received: boolean }) => {
    if (ack?.received) {
      NotificationModel.updateOne({ _id: notif._id }, { delivered: true }).exec();
    }
  });
  // 👉 En el cliente lo escuchás con:
  // socket.on("NOTIF:NEW", (notif) => {
  // console.log("📩 Nueva notificación:", notif);
  // });
  return notif;
}



// Notas prácticas notifs

// Unir al user:{id} en initSocket tras validar token (más sencillo).

// Para notifs importantes (email, push) lanzar worker que también envíe push/email.

// Si escalás en múltiples instancias: usar Redis adapter para que io.to(room) funcione cross-instance.