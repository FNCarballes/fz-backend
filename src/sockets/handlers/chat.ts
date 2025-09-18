// Unirse/salir de salas (rooms).

// Enviar mensajes con persistencia (DB).

// Broadcast solo a la room correspondiente.

// Indicadores de escritura (typing) sin acks pesados.

// Validación + permisos + ack.

// src/sockets/handlers/chat.ts
import { Server } from "socket.io";
import { z } from "zod";
import { AppSocket, EVENTS } from "../middlewaresSockets/types";
import { safeHandler } from "../indexSocket";
import {sendMessage} from "../../routes/services/chatServices"; // tu lógica DB
// Cliente → Servidor: verbos como send, create, join, markRead.

// Servidor → Cliente: verbos como new, updated, broadcast, notify.
const SendMessageSchema = z.object({
  roomId: z.string().min(1),               // aquí llamamos roomId (room == chat)
  text: z.string().min(1).max(2000),
  clientMessageId: z.string().optional(), // idempotency
});

export function registerChatHandlers(socket: AppSocket, io: Server) {
  // join
  socket.on(
    EVENTS.CHAT.JOIN,
    safeHandler(async (sock, payload: { roomId: string }, ack?: Function) => {
      const roomId = String(payload.roomId);
      // permiso: validar si puede unirse (ej. ChatService.canJoin)
      sock.join(`chat:${roomId}`);
      io.to(`chat:${roomId}`).emit(EVENTS.CHAT.MEMBER_JOINED ?? "chat:member:joined", {
        userId: sock.data.user.userId,
      });
      if (typeof ack === "function") ack({ ok: true });
    })
  );

  // send message (persistir y emitir a la room)
  socket.on(
    EVENTS.CHAT.SEND,
    safeHandler(async (sock, raw, ack?: Function) => {
      const payload = SendMessageSchema.parse(raw);
      const userId = sock.data.user.userId;

      // llamamos al service usando nombres consistentes
      const saved = await sendMessage({
        chatId: payload.roomId,     // map roomId -> chatId
        senderId: userId,
        content: payload.text,
        clientMessageId: payload.clientMessageId,
      });

      // emitir solo a la room
      io.to(`chat:${payload.roomId}`).emit(EVENTS.CHAT.NEW, {
        message: saved,
      });

      if (typeof ack === "function") ack({ ok: true, message: saved });
    })
  );

  // typing indicator (no ack)
  socket.on(
    EVENTS.CHAT.TYPING,
    safeHandler((sock, payload: { roomId: string; typing: boolean }) => {
      const room = `chat:${payload.roomId}`;
      socket.to(room).emit(EVENTS.CHAT.TYPING, {
        userId: sock.data.user.userId,
        typing: payload.typing,
      });
    })
  );

  // leave
  socket.on(
    EVENTS.CHAT.LEAVE,
    safeHandler((sock, payload: { roomId: string }, ack?: Function) => {
      const room = `chat:${payload.roomId}`;
      sock.leave(`chat:${payload.roomId}`);
      io.to(room).emit(EVENTS.CHAT.MEMBER_LEFT ?? "chat:member:left", { userId: sock.data.user.userId });
      if (typeof ack === "function") ack({ ok: true });
    })
  );
}

//Notas prácticas chat.ts
// Idempotencia: aceptar clientMessageId para evitar duplicados en reconexión.
// 
// Rate limiting: no permitir > X mensajes / s por socket (ya tenés middleware).
// 
// Archivos: usar pre-signed URLs para subir a S3 y enviar sólo metadata por socket.
// 
// Historial: fetch_history via HTTP o socket con paginación (mejor HTTP por tamaño).