//~/index.ts
import express from "express";
import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
//Aquí estás importando ese router, y le das el nombre local userRoutes.
//Ese nombre lo decides tú. Podrías llamarlo usuarios, miRouter, o cualquier otra cosa
import userRoutes from "./routes/userRout";
import eventRoutes from "./routes/eventRout";
import loginRout from "./routes/loginRout";
import userGoogleRout from "./routes/userGoogleRout";
import s3Routes from "./routes/s3";
import eventRequestRoutes from "./routes/eventRequestRout";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors"; //Para permitir peticiones desde otros dominios
import helmet from "helmet"; //Para cabeceras de seguridad
import morgan from "morgan"; //Para logs de peticiones HTTP
import rateLimit from "express-rate-limit"; //Para limitar la tasa de peticiones, evita abusos.
import { validateEnv } from "./types/config/env";

// Define una interfaz para app
declare module "express-serve-static-core" {
  interface Application {
    io: SocketIOServer;
  }
}

dotenv.config();
const env = validateEnv();

const app = express();

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// Hacelo accesible en las rutas
app.set("io", io);

//🛡️ En producción, deberías reemplazar "*" por el
//  dominio real (ej: "https://friendzone.app").!!!!!!
app.use(
  cors({
    origin: "*", // <<--- permite todo (solo en desarrollo)
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
);

app.use(express.json());

app.use(helmet());
app.use(morgan("combined"));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.get("/", (req, res) => {
  res.send("✅ Servidor funcionando");
});

app.use("/api/auth", loginRout);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/eventRequests", eventRequestRoutes);
app.use("/api/userGoogle", userGoogleRout);
app.use("/api/s3", s3Routes);

// 4. Middleware global de errores
// 4. Middleware global de errores
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("❌ Error no manejado:", err.stack || err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
};

// Siempre al final, **después** de todas las rutas:
app.use(errorHandler);

const PORT = env.PORT;
mongoose
  .connect(env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error al conectar MongoDB:", err);
  });
