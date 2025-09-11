// src/auth/middlewares/rateLimiters.ts
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import "../../dataStructure/mongooseModels/EventsModel"; // si lo necesitás sólo para registrar el modelo
import { AuthRequest } from "../../dataStructure/types/express/Index";

// helper local para normalizar IP o fallback
const normalizeIp = (req: any) => {
  const ip = req?.ip;
  if (typeof ip === "string" && ip.length) return ipKeyGenerator(ip);
  // fallback razonable (evita pasar undefined al helper)
  const remote = req?.connection?.remoteAddress;
  if (typeof remote === "string" && remote.length) return ipKeyGenerator(remote);
  return "unknown";
};

// FOR LOGIN
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Demasiados intentos de login. Intenta más tarde." },
  // si querés por IP usa normalizeIp, si preferís por otra cosa no lo pongas
  keyGenerator: (req) => normalizeIp(req),
});

// FOR USERS AND REQUESTSENT
export const limitCreateUser = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Demasiados intentos de registro. Intenta más tarde." },
  keyGenerator: (req) => normalizeIp(req),
});

export const limitEventRequestsSent = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Demasiadas solicitudes. Intenta más tarde." },
  keyGenerator: (req: any) => {
    const userId = req.userId;
    if (typeof userId === "string" && userId.length) return userId;
    return normalizeIp(req);
  },
});

// FOR EVENTS AND EVENTREQUESTS
export const limitPostEventRequest = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Demasiadas solicitudes de evento. Intenta más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => (req?.userId ? String(req.userId) : normalizeIp(req)),
});

export const limitGetEventRequest = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // máximo 60 requests por IP por minuto
  message: "Too many requests from this IP, please try again later.",
});

export const limitPatchEventRequest = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos de actualización. Intenta más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => (req?.userId ? String(req.userId) : normalizeIp(req)),
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 refresh por ventana
  message: { error: "Demasiadas solicitudes de refresh. Intenta más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    const deviceId = req.body?.deviceId;
    const userId = req.userId; // si ya seteás userId en req tras validar JWT
    if (typeof userId === "string" && typeof deviceId === "string") {
      return `${userId}:${deviceId}`;
    }
    // fallback seguro si no hay userId aún (ataques o requests inválidos)
    return normalizeIp(req);
  },
});