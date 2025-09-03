// ~/src/app.ts
import "./utils/monitoring/sentry/instrument.js"
import * as Sentry from "@sentry/node"
import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { logger } from "./utils/logger/logger";
import loginRoute from "./routes/loginRoute";
import userRoute from "./routes/userRoute";
import eventRoute from "./routes/eventRoute";
import eventRequestRoute from "./routes/eventRequestRoute";
import s3Routes from "./routes/s3";
import { metricsMiddleware, metricsEndpoint } from "./utils/monitoring/prometheus";
import mongoose from "mongoose";
import crypto from "crypto";
import { requestMiddleware } from "./utils/monitoring/sentry/requestMiddleware";

const app = express();
app.use((req, res, next) => {
  (req as any).id = crypto.randomUUID();
  res.setHeader("X-Request-Id", (req as any).id);
  next();
});
app.use(requestMiddleware);
// Middlewares
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === "production" }));
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(globalLimiter);
// metrics for request
app.use(metricsMiddleware);
// endpoint for Prometheus
app.get("/metrics", metricsEndpoint);
app.get("/healthz", (req, res) => res.status(200).json({ status: "ok" }));

app.get("/readyz", async (req, res) => {
  if(!mongoose.connection.db ) return res.status(500).json({ status: "not-ready" })
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ status: "ready" });
  } catch (e: any) {
    res.status(500).json({ status: "not-ready", error: e.message });
  }
});
// Rutas
app.use("/api/auth", loginRoute);
app.use("/api/users", userRoute);
app.use("/api/events", eventRoute);
app.use("/api/eventRequests", eventRequestRoute);
app.use("/api/s3", s3Routes);
Sentry.setupExpressErrorHandler(app);
app.use(function onError(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("❌ Global error handler:", err);  // 👈 LOG ORIGINAL
  res.status(500).json({
    error: err.message || "Error interno del servidor",
    stack: err.stack, // 👈 temporalmente para debug
  });
});
export default app;
