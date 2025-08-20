// ~/src/index.ts

import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { setupSocketIO } from "./sockets/setUpSockets";
import { logger } from "./utils/logger/logger";
import { validateEnv } from "./types/config/validateEnv";
import app from "./app";
import { initSocket } from "./sockets/socket";


dotenv.config();
const env = validateEnv();

const server = http.createServer(app);

// Usamos el initSocket en vez de instanciar new SocketIOServer acá
const io = initSocket(server);
setupSocketIO(io);

// Si querés tener acceso a io desde express (ejemplo: middlewares)
app.set("io", io);

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

// Graceful shutdown
process.on("SIGINT", () => server.close(() => mongoose.disconnect()));
process.on("SIGTERM", async () => {
  logger.info("Cerrando servidor...");
  io.close();
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});