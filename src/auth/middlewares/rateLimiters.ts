import rateLimit from "express-rate-limit";
import "../models/Events"; // Importar solo para registrar el modelo
import { AuthRequest } from "../../types/express";

//FOR LOGIN
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // máximo 5 intentos por IP por minuto
  message: { error: "Demasiados intentos de login. Intenta más tarde." },
});

//FOR USERS AND REQUESTSENT

export const limitCreateUser = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 cuentas por IP
  message: { error: "Demasiados intentos de registro. Intenta más tarde." },
  keyGenerator: (req) => req.ip?.toString() || "unknown",
});

export const limitEventRequestsSent = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: { error: "Demasiadas solicitudes. Intenta más tarde." },
  keyGenerator: (req): string => {
    const userId = (req as AuthRequest).userId;
    const ip = req.ip ?? "unknown-ip"; // fallback si fuera undefined
    return typeof userId === "string" ? userId : ip;
  },
});



//FOR EVENTS AND EVENTREQUESTS
export const limitPostEventRequest = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // máximo 5 solicitudes por minuto
  message: {
    error: "Demasiadas solicitudes de evento. Intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).userId || req.ip;
  },
});

export const limitPatchEventRequest = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 cambios por minuto
  message: {
    error: "Demasiados intentos de actualización. Intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).userId || req.ip;
  },
});