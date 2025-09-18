// src/sockets/setupSocket.ts
import type { Server, Socket } from "socket.io";
import { logger } from "../../utils/logger/logger";
import { activeSockets } from "../../utils/monitoring/prometheus";
import { validate, sendMessageSchema } from "../../dataStructure/schemasZod/sockets/socketsSchema";
export function setupSocketIO(io: Server) {
  io.on("connection", (socket: Socket) => {
    activeSockets.inc();
    const userId = socket.data.userId as string | undefined;

    if (!userId) {
      logger.warn({ socketId: socket.id }, "⚠️ Conexión sin userId; desconectando");
      socket.disconnect(true);
      return;
    }

    socket.join(userId);
    logger.info({ socketId: socket.id, userId }, "✅ Socket unido automáticamente al room del usuario");

    // (Opcional) listeners de debug/errores
    socket.on("error", (err) => {
      logger.error({ socketId: socket.id, err }, "Socket error");
    });

    socket.on('send-message', (raw, ack) => {
  try {
    const data = validate(sendMessageSchema)(raw);
    // proceder: autorizar, guardar, emitir
  } catch (err) {
    if (typeof ack === 'function') ack({ ok: false, code: 'INVALID_PAYLOAD' });
  }
});


    socket.on("disconnect", (reason) => {
      socket._cleanup
      activeSockets.dec();
      logger.info({ socketId: socket.id, reason }, "⛔ Socket desconectado");
    });
  });
}
