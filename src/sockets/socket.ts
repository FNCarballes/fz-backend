// src/sockets/socket.ts
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { logger } from "../utils/logger/logger";

// Ajustá según tu proyecto
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "*";

let io: Server | undefined;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: FRONTEND_ORIGIN,
      credentials: FRONTEND_ORIGIN !== "*", // true si seteas un origin específico
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    // path: "/socket.io", // descomenta si personalizás la ruta
  });

  // Middleware de autenticación: resolvé el userId acá.
  io.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const header = socket.handshake.headers?.authorization as string | undefined;

      const token = auth.token || (header?.startsWith("Bearer ") ? header.slice(7) : undefined);

      // TODO: reemplazar por tu verificación real (JWT, etc.)
      const userId = fakeExtractUserId(token);
      if (!userId) return next(new Error("unauthorized"));

      socket.data.userId = userId;
      return next();
    } catch (e) {
      return next(new Error("unauthorized"));
    }
  });

  return io;
}

export function getIo(): Server {
  if (!io) throw new Error("❌ Socket.IO no inicializado");
  return io;
}

// Simulación (reemplazar por verificación real)
function fakeExtractUserId(token?: string): string | null {
  return token ? token : null;
}
