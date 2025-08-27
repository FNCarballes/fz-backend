// src/services/NotificationService.ts
import { getIo } from "../../sockets/socket";
import { logger } from "../../utils/logger/logger";

export function notifyUser(userId: string, event: string, payload: any) {
  try {
    const io = getIo();
    io.to(userId).emit(event, payload);
    logger.info({ userId, event }, "📢 Notificación enviada");
  } catch (e) {
    logger.error({ e, userId, event }, "❌ No se pudo notificar (io no disponible)");
  }
}
