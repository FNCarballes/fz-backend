// src/auth/verifyToken.ts
import jwt, { JwtPayload } from "jsonwebtoken";
import { validateEnv } from "../../dataStructure/types/config/ValidateEnv";
import { publicKey } from "../../utils/keys/keys";

const env = validateEnv();
// src/errors/authErrors.ts
export class AuthError extends Error {
    public code: string;
    constructor(code: string, message?: string) {
        super(message ?? code);
        this.code = code;
        this.name = 'AuthError';
    }
}
export class TokenMissingError extends AuthError { constructor() { super('TOKEN_MISSING'); } }
export class TokenInvalidError extends AuthError { constructor() { super('TOKEN_INVALID'); } }
export class TokenRevokedError extends AuthError { constructor() { super('TOKEN_REVOKED'); } }


export type TokenPayload = JwtPayload & {
    userId: string;
    role?: string;
    sessionId?: string;
    jti?: string;
};

export function verifyTokenOrThrow(token?: string): TokenPayload {
    if (!token) throw new TokenMissingError();

    const key = publicKey || env.JWT_SECRET;
    if (!key) throw new Error('JWT key not configured');

    try {
        const decoded = jwt.verify(token, key, {
            algorithms: ['RS256'],
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE || 'mobile',
            clockTolerance: 5, // opcional
        }) as TokenPayload;

        // normalizar
        decoded.userId = decoded.sub ?? decoded.userId ?? (decoded as any).id;
        if (!decoded.userId) throw new TokenInvalidError();

        return decoded;
    } catch (err: any) {
        // lanzar errores tipados para que el middleware decida qué hacer
        throw new TokenInvalidError();
    }
}

