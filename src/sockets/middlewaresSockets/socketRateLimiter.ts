// src/sockets/rateLimiter.ts
import { Socket } from 'socket.io';
import { createClient } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

export function socketRateLimiter({ limit = 20, windowSec = 1 } = {}) {
  return async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const userId = socket.data.user?.userId ?? socket.handshake.address ?? 'anonymous';
      const key = `rl:${userId}`;
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSec);
      }
      if (current > limit) {
        return next(new Error('RATE_LIMIT_EXCEEDED'));
      }
      return next();
    } catch (err) {
      console.error('rate limiter error', err);
      return next();
    }
  };
}
