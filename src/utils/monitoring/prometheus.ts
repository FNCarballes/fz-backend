import client from "prom-client";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

// --- MÉTRICAS HTTP ---
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total de requests HTTP",
  labelNames: ["method", "route", "status"]
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duración de requests en segundos",
  labelNames: ["method", "route", "status"],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

// --- MÉTRICAS DE NEGOCIO ---
export const usersCreated = new client.Counter({
  name: "app_users_created_total",
  help: "Total de usuarios creados"
});

export const eventsCreated = new client.Counter({
  name: "app_events_created_total",
  help: "Total de eventos creados"
});

export const eventRequestsCreated = new client.Counter({
  name: "app_event_requests_created_total",
  help: "Total de solicitudes de unión a eventos creadas",
  labelNames: ["status"]
});

export const appErrors = new client.Counter({
  name: "app_errors_total",
  help: "Errores capturados en el backend",
  labelNames: ["type"] // ej: db, validation, external_api
});

export const mongoConnections = new client.Gauge({
  name: "mongo_connections",
  help: "Número de conexiones activas a MongoDB"
});

setInterval(() => {
  mongoConnections.set(mongoose.connections.length);
}, 10000);

export const activeSockets = new client.Gauge({
  name: "socketio_connections",
  help: "Conexiones activas de Socket.IO"
});

// --- MÉTRICAS DEL SISTEMA ---
client.collectDefaultMetrics();

// --- MIDDLEWARE ---
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });
    end({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });
  });
  next();
};

// --- ENDPOINT /metrics ---
export const metricsEndpoint = async (_req: Request, res: Response) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
};
