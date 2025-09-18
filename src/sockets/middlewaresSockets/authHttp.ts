// src/middlewares/authHttp.ts (Express)
import { Request, Response, NextFunction } from 'express';
import { extractBearer } from './extractBearer';
import { verifyTokenOrThrow } from './verifyToken';
import { isSessionActive, isTokenRevoked } from './sessionStore';

export async function authHttp(req: Request, res: Response, next: NextFunction) {
    try {
        const token = extractBearer(req.headers.authorization);
        if (!token) return res.status(401).send({ code: 'TOKEN_MISSING' });
        const payload = verifyTokenOrThrow(token);

        if (await isTokenRevoked(payload.jti)) return res.status(401).send({ code: 'TOKEN_REVOKED' });
        if (!(await isSessionActive(payload.userId, payload.sessionId))) return res.status(401).send({ code: 'SESSION_INACTIVE' });

        (req as any).user = payload;
        next();
    } catch (err: any) {
        // log detallado en server
        req.log?.error?.({ err }, 'auth failed'); // si usás pino
        res.status(401).send({ code: err.code ?? 'AUTH_FAILED' });
    }
}
