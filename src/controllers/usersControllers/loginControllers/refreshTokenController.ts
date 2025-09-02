//src/controllers/usersControllers/loginControllers/refreshTokenController
import { publicKey } from "../../../utils/keys/keys";  // ajusta ruta según estructura
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import { generateTokens } from "../../../utils/generateTokens";
import { RefreshTokenModel } from "../../../models/RefreshTokenModel";
import { logger } from "../../../utils/logger/logger"
import { z } from "zod";
import bcrypt from "bcrypt";
const schema = z.object({
  refreshToken: z.string().min(20),
  deviceId: z.string().min(6),
});

export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Bad request" });
    return
  }
  const { refreshToken, deviceId } = parsed.data;
  try {
    const decoded = jwt.verify(refreshToken, publicKey, {
      algorithms: ["RS256"],
      issuer: process.env.JWT_ISSUER,
      audience: "mobile",
    }) as JwtPayload & { jti?: string, sub?: string, email: string };

    const userId = decoded.sub || decoded.userId;
    if (!userId || !decoded.jti) {
      res.status(401).json({ message: "Token inválido" });
      return
    }

    const session = await RefreshTokenModel.findOne({
      userId: decoded.userId,
      deviceId,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      // No hay sesión activa -> posible reuso del token
      // Medida: revocar todas las sesiones del usuario y forzar re-login.
      await RefreshTokenModel.updateMany({ userId: decoded.userId }, { $set: { revokedAt: new Date() } });
      res.status(401).json({ message: "Token inválido o reuso detectado — cerrá sesión en todos los dispositivos" });
      return
    }


    const isMatch = await bcrypt.compare(String(decoded.jti), session.tokenHash);
    if (!isMatch) {
      // Reuso o manipulación: revocar todas sesiones
      await RefreshTokenModel.updateMany({ userId: decoded.userId }, { $set: { revokedAt: new Date() } });
      res.status(401).json({ message: "Token inválido (reuso detectado)" });
      return
    }

    // Revocación atómica para evitar carreras
    const updated = await RefreshTokenModel.updateOne(
      { _id: session._id, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
    if (updated.modifiedCount === 0) {
      res.status(409).json({ message: "Token ya rotado" });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken, jti } = await generateTokens(decoded.userId, decoded.email);

    const jtiHash = await bcrypt.hash(jti, 12); // cost: 12 (ajustar según CPU)
    const userAgent = String(req.headers["user-agent"] || "unknown");
    const ip = req.ip;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30d

    // Generar nuevos tokens
    const newSession = await RefreshTokenModel.create({
      userId: decoded.userId,
      tokenHash: jtiHash,
      deviceId,
      userAgent,
      ip,
      expiresAt
    });
    await RefreshTokenModel.findByIdAndUpdate(session._id, { replacedBy: newSession._id });
    res.json({ accessToken, refreshToken: newRefreshToken });
    //Devuelve json para mobiles
  } catch (error) {
    logger.error({ error, ip: req.ip }, "Error en refreshTokenController");
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};