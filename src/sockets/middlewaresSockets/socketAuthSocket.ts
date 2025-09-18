// src/sockets/authSocket.ts (Socket.IO middleware)
import { Socket } from 'socket.io';
import { extractBearer } from './extractBearer';
import { verifyTokenOrThrow } from './verifyToken';
import { isSessionActive, isTokenRevoked } from './sessionStore';

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const header = socket.handshake.headers?.authorization;
    const token = socket.handshake.auth?.token || extractBearer(header);
    const payload = verifyTokenOrThrow(token);

    if (await isTokenRevoked(payload.jti)) return next(new Error('AUTH_TOKEN_REVOKED'));
    if (!(await isSessionActive(payload.userId, payload.sessionId))) return next(new Error('AUTH_SESSION_INVALID'));

    socket.data.user = payload;
    next();
  } catch (err: any) {
    // log detallado en servidor, al cliente solo le mandás un código
    console.error('socket auth failed', err);
    return next(new Error('AUTH_INVALID'));
  }
}
