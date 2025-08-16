// auth/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { publicKey } from "../../utils/keys/keys";
export function authMiddleware(
  req: Request,
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
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
    if (typeof decoded === "object" && "id" in decoded) {
      // Asegura que userId siempre sea string
      const id = (decoded as any).id;
  (req as any).userId = typeof id === "string" ? id : id.toString();
      next();
    } else {
      res.status(401).json({ error: "Token inválido" });
    }
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
