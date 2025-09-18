// src/services/sessionStore.ts
import { createClient, RedisClientType } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

export async function isSessionActive(userId: string, sessionId?: string): Promise<boolean> {
  if (!sessionId) return false;
  // ejemplo: guardás keys tipo session:<userId>:<sessionId> = "active"
  const key = `session:${userId}:${sessionId}`;
  const val = await redis.get(key);
  return val === 'active';
}

export async function isTokenRevoked(jti?: string): Promise<boolean> {
  if (!jti) return false;
  return (await redis.sIsMember('revoked_jtis', jti)) ?? false;
}
