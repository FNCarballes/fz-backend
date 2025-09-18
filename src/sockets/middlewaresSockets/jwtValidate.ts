// src/middlewares/jwtMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyTokenAndGetUserId } from "./verifyToken";

declare global {
    namespace Express {
        interface Request {
            user?: { id: string };
        }
    }
}

export async function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const userId = await verifyTokenAndGetUserId(token);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    req.user = { id: userId };
    next();
}
