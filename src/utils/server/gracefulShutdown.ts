import mongoose from "mongoose";
import { logger } from "../logger/logger";
import type { Server } from "http";
import type { Server as SocketIOServer } from "socket.io";

export const gracefulShutdown = (server: Server, io: SocketIOServer) => {
  return async (signal: string) => {
    try {
      logger.info(`📴 Recibida señal ${signal}, cerrando servidor...`);

      // Cerramos Socket.IO
      io.close();

      // Cerramos servidor HTTP
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      // Cerramos conexión a Mongo
      await mongoose.disconnect();

      logger.info("✅ Servidor cerrado correctamente");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "❌ Error en graceful shutdown");
      process.exit(1);
    }
  };
};
