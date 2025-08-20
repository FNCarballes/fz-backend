// ~/src/app.ts
import "./utils/monitoring/instrument.js"
import * as Sentry from "@sentry/node"
import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
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
app.use(mongoSanitize());
app.use(helmet({ contentSecurityPolicy: true }));
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(globalLimiter);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: "Demasiados intentos desde esta IP. Intenta más tarde.",
});
// metrics for request
app.use(metricsMiddleware);
// endpoint for Prometheus
app.get("/metrics", metricsEndpoint);
app.get("/healthz", (req, res) => res.status(200).json({ status: "ok" }));

app.get("/readyz", async (req, res) => {
  if(!mongoose.connection.db) return res.status(500).json({ status: "not-ready" })
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ status: "ready" });
  } catch (e: any) {
    res.status(500).json({ status: "not-ready", error: e.message });
  }
});


app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("un nuevo eeerrror!");
});
// Rutas
app.use("/api/auth", authLimiter, loginRoute);
app.use("/api/users", userRoute);
app.use("/api/events", eventRoute);
app.use("/api/eventRequests", eventRequestRoute);
app.use("/api/s3", s3Routes);
Sentry.setupExpressErrorHandler(app);
// Optional fallthrough error handler
app.use(function onError(err: any, req: Request, res: Response, next: NextFunction) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end((res as any).sentry + "\n");
});
export default app;
