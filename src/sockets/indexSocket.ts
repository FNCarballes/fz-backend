// src/sockets/socket.ts
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyTokenOrThrow } from "./middlewaresSockets/verifyToken";
import { socketAuthMiddleware } from "./middlewaresSockets/socketAuthSocket";
import { socketRateLimiter } from "./middlewaresSockets/socketRateLimiter";
import { safeHandler } from "./middlewaresSockets/safeHandler";
// import { createClient } from "redis";
// import { createAdapter } from "@socket.io/redis-adapter";
import { registerChatHandlers } from "./handlers/chat";
import { registerNotificationHandlers } from "./handlers/notifications";

// Ajustá según tu proyecto
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "*";

let io: Server | undefined;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: FRONTEND_ORIGIN,
      credentials: FRONTEND_ORIGIN !== "*", // true si seteas un origin específico
    },
    transports: ["websocket"],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB límite por mensaje (ajustar según tu caso)
    serveClient: false,     // no expongas la lib cliente desde el servidor
    path: "/realtime",      // ruta personalizada para sockets
  });
  /*REDIS - Permite escalar Socket.IO horizontalmente (múltiples instancias comparten estado de conexiones).*/

  // Redis adapter (si hay REDIS_URL)
  // if (process.env.REDIS_URL) {
  //   const pubClient = createClient({ url: process.env.REDIS_URL });
  //   const subClient = pubClient.duplicate();
  //   await pubClient.connect();
  //   await subClient.connect();
  //   io.adapter(createAdapter(pubClient, subClient));
  // }


  /*socketAuthMiddleware → validaciones adicionales de autenticación.
socketRateLimiter → limita a 25 eventos por segundo.*/
  io.use(socketAuthMiddleware);
  io.use(socketRateLimiter({ limit: 25, windowSec: 1 }));

  // Middleware de autenticación por token
  /** Extrae el token del handshake.auth o headers.authorization.

Verifica el token con verifyTokenOrThrow.

Guarda el payload en socket.data.user → accesible en todos los eventos. */
  io.use(async (socket, next) => {
    try {
      const header = socket.handshake.headers?.authorization;
      const token =
        socket.handshake.auth?.token ||
        (header?.startsWith("Bearer ") ? header.slice(7) : undefined);

      const payload = await verifyTokenOrThrow(token);

      if (!payload) return next(new Error("AUTH_INVALID"));

      socket.data.user = payload; // userId, role, sessionId, etc.
      next();
    } catch (err) {
      next(new Error("AUTH_ERROR"));
    }
  });

  /**
   * Evento connection → se ejecuta cuando un usuario se conecta.

Guarda el userId y loguea.

Evento ping → ejemplo de evento protegido con safeHandler.

Evento disconnect → loguea motivo de desconexión.
   */
  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (!io) throw new Error("❌ Socket.IO no inicializado")
    console.log(`✅ Usuario conectado: ${user.userId}`);
    registerChatHandlers(socket, io);
    registerNotificationHandlers(socket, io);
    socket.on("disconnect", (reason) => {
      console.log(`❌ Usuario ${user.userId} desconectado: ${reason}`);
    });
  });

  return io;
}
/**Permite usar io en cualquier parte del backend después de initSocket().

Si lo llamás antes de inicializar, tira error. */
export function getIo(): Server {
  if (!io) throw new Error("❌ Socket.IO no inicializado");
  return io;
}


