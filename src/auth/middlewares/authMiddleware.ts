// auth/authMiddleware.ts
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types/express";
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token no proporcionado" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    if (typeof decoded === "object" && "id" in decoded) {
      req.userId = decoded.id;
      next(); // ✅ sigue el flujo si está todo bien
    } else {
      res.status(401).json({ error: "Token inválido" });
    }
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
