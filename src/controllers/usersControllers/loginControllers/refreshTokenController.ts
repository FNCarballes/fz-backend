import { publicKey } from "../../../utils/keys/keys";  // ajusta ruta según estructura
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { generateTokens } from "../../../utils/generateTokens";
import { RefreshTokenModel } from "../../../models/RefreshTokenModel";
import {logger} from "../../../utils/logger/logger"
export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  const userAgent = req.headers["user-agent"] || "unknown";

  if (!refreshToken) {
    res.status(400).json({ error: "Falta refreshToken" });
    return;
  }

  const storedToken = await RefreshTokenModel.findOne({ token: refreshToken });
  if (!storedToken) {
    res.status(403).json({ error: "Token inválido" });
    return;
  }

  if (new Date() > storedToken.expiresAt) {
    await storedToken.deleteOne();
    res.status(403).json({ error: "Token expirado" });
    return;
  }

  if (storedToken.device !== userAgent) {
    await storedToken.deleteOne();
    res.status(403).json({ error: "Dispositivo no reconocido" });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, publicKey, { algorithms: ["RS256"] }) as { id: string; email?: string };

    await storedToken.deleteOne();

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      payload.id,
      payload.email || "",
      userAgent,
      req.ip || "unknown",
      "refresh-device"
    );

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    logger.error({err}, "Token error:" );
    res.status(403).json({ error: "Token expirado o inválido" });
  }
};
