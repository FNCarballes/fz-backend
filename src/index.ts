// ~/src/index.ts
import "./config/env";  // Carga primero las variables de entorno
import http from "http";
import mongoose from "mongoose";
import { logger } from "./utils/logger/logger"; 
import { validateEnv } from "./dataStructure/types/config/ValidateEnv";
import app from "./app";
import { setupSocketIO } from "./sockets/setUpSockets";
import { initSocket } from "./sockets/socket";
import { gracefulShutdown } from "./utils/server/gracefulShutdown";

const env = validateEnv();
const server = http.createServer(app);

// Usamos el initSocket en vez de instanciar new SocketIOServer acá
const io = initSocket(server);

// Si querés tener acceso a io desde express (ejemplo: middlewares)
app.set("io", io);
//Configurarlos
setupSocketIO(io);
// Conexión DB + levantar server
mongoose
  .connect(env.MONGO_URI, {
    autoIndex: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    server.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, "🚀 Servidor corriendo");
    });
  })
  .catch((err) => {
    logger.error({ err }, "❌ Error al conectar MongoDB");
    process.exit(1);
  });


// Graceful shutdown centralizado
const shutdownHandler = gracefulShutdown(server, io);
process.on("SIGINT", () => shutdownHandler("SIGINT"));
process.on("SIGTERM", () => shutdownHandler("SIGTERM"));