import rateLimit from "express-rate-limit";

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