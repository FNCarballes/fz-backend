// ~/index.ts
import express, {Request, Response} from "express";
import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { validateEnv } from "./types/config/env";
import { setupSocketIO } from "./sockets/sockets";
import userRoute from "./routes/userRoute";
import eventRoute from "./routes/eventRoute";
import loginRoute from "./routes/loginRoute";
import s3Routes from "./routes/s3";
import eventRequestRoute from "./routes/eventRequestRoute";
import { logger } from "./utils/logger/logger"; // pino instance

declare module "express-serve-static-core" {
  interface Application {
    io: SocketIOServer;
  }
}
dotenv.config();
const env = validateEnv();

const app: express.Application = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // DEBE cambiarse en prod
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});
setupSocketIO(io);
app.set("io", io);

// si estás detrás de un proxy (nginx, heroku, etc)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Logging middleware (pino-http) -> añade req.log
app.use(pinoHttp({ logger }));

// Parse bodies (IMPORTANT: limitar tamaño)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Security middlewares (orden: body parser -> sanitize -> other)
app.use(mongoSanitize()); // protege de $ / . en payloads
app.use(helmet({
  // desactivar CSP por ahora si rompe el front; idealmente configurar CSP concreto
  contentSecurityPolicy: false,
}));

// Rate limiting:
// - Limit global (básico), luego aplicar límites más estrictos por ruta sensible
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // ejemplo: request por window por IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Auth-specific limiter (más agresivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: "Demasiados intentos desde esta IP. Intenta más tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
//app.get("/health", (req, res) =>
 // res.status(200).json({ status: "ok", uptime: process.uptime() })
//);

//app.get("/", (req: Request, res: Response) => res.send("✅ Servidor funcionando"));

// Rutas (aplicar authLimiter en /api/auth)
app.use("/api/auth", authLimiter, loginRoute);
app.use("/api/users", userRoute);
app.use("/api/events", eventRoute);
app.use("/api/eventRequests", eventRequestRoute);
app.use("/api/s3", s3Routes);

// Helper para sanitizar lo que logueamos del body (no loguear contraseñas)
const safeBodyForLog = (body: any) => {
  try {
    if (!body) return undefined;
    const copy = { ...body };
    if (copy.password) copy.password = "***";
    if (copy.token) copy.token = "***";
    return copy;
  } catch {
    return undefined;
  }
};

// Error handler (usar logger pino)
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Loguear con contexto mínimo (no volcar body entero sin limpiar)
  logger.error(
    {
      err,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      body: safeBodyForLog(req.body),
    },
    "Unhandled error"
  );

  const status = (err as any).statusCode || (err as any).status || 500;
  const isProd = process.env.NODE_ENV === "production";
  res.status(status).json({ error: isProd ? "Internal Server Error" : err.message });
};

app.use(errorHandler);

// Conexión a MongoDB + opciones de resiliencia
mongoose
  .connect(env.MONGO_URI, {
    autoIndex: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    server.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, "Servidor corriendo");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Error al conectar MongoDB");
    process.exit(1);
  });

// Manejo de excepciones y shutdown ordenado
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaughtException - saliendo");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandledRejection");
  // opcional: cerrar server y salir o intentar reconectar según tu política
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info({ signal }, "Shutdown iniciado");
  server.close(async () => {
    try {
      await mongoose.disconnect();
      logger.info("Mongo disconnected");
      process.exit(0);
    } catch (e) {
      logger.error({ e }, "Error during shutdown");
      process.exit(1);
    }
  });

  // Forzar cierre si tarda demasiado
  setTimeout(() => {
    logger.fatal("Forzando shutdown");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default app;
