import { Socket } from "socket.io";
import { ZodError } from "zod";

/**
 * Wrapper para manejar errores en eventos de sockets
 * Envuelve los handlers de eventos (socket.on) en un try/catch.

Evita que un error en un evento rompa toda la conexión.

Emite un mensaje de error controlado al cliente.
 */


export function safeHandler(socket: Socket, handler: (socket: Socket, raw: any, ack?: Function) => Promise<void> | void) {
  return async (raw: any, ack?: Function) => {
    try {
      await handler(socket, raw, ack);
    } catch (err: any) {
      console.error({ socketId: socket.id, user: socket.data?.user, err }, "socket handler error"); // log estructurado
      if (err instanceof ZodError) {
        ack?.({ success: false, error: "INVALID_PAYLOAD" });
      } else if (err.message === "NOTIFICATION_NOT_FOUND") {
        ack?.({ success: false, error: "NOT_FOUND" });
      } else {
        ack?.({ success: false, error: "INTERNAL_ERROR" });
      }
    }
  };
}

// export function safeHandler(socket: Socket, handler: (socket: Socket, raw: any, ack?: Function) => Promise<void> | void) {
// return async (raw: any, ack?: Function) => {
// try {
// await handler(socket, raw, ack);
// } catch (err) {
// console.error({ socketId: socket.id, user: socket.data?.user, err }, "socket handler error");
// enviar solo código/mensaje mínimo al cliente
// if (typeof ack === "function") {
// ack({ success: false, error: "INTERNAL_ERROR" });
// } else {
// socket.emit("ERROR", { code: "INTERNAL_ERROR" });
// }
// }
// };
// }
// 