// ~/app.ts
import express, { ErrorRequestHandler } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
// import mongoSanitize from "express-mongo-sanitize";
import { logger } from "./utils/logger/logger";
import loginRoute from "./routes/loginRoute";
import userRoute from "./routes/userRoute";
import eventRoute from "./routes/eventRoute";
import eventRequestRoute from "./routes/eventRequestRoute";
import s3Routes from "./routes/s3";

const app = express();

// Middlewares
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(helmet({ contentSecurityPolicy: false }));

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: "Demasiados intentos desde esta IP. Intenta más tarde.",
});

// Rutas
app.use("/api/auth", authLimiter, loginRoute);
app.use("/api/users", userRoute);
app.use("/api/events", eventRoute);
app.use("/api/eventRequests", eventRequestRoute);
app.use("/api/s3", s3Routes);

// Error handler
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err, method: req.method, url: req.originalUrl }, "Unhandled error");
  const status = (err as any).statusCode || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
};

app.use(errorHandler);

export default app;
