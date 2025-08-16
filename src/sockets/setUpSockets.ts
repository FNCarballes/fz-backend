// src/socket/setupSocket.ts
import { Socket } from "socket.io";
import { logger } from "../utils/logger/logger";
import {initSocket} from "./socket"

export function setupSocketIO(io: ReturnType<typeof initSocket>) {
  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "🔌 Socket conectado:");

    socket.on("join", (userId: string) => {
      if (!userId) return;
      socket.join(userId);
      logger.info({ socketId: socket.id, userId }, "✅ Socket unido a room de usuario");
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "⛔ Socket desconectado:");
    });
  });
}
