import { generateTokens } from "../../../utils/generateTokens";
import { RefreshTokenModel } from "../../../models/RefreshTokenModel";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
export const refreshTokenController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: "Falta refreshToken" });
    return;
  }

  const storedToken = await RefreshTokenModel.findOne({ token: refreshToken });
  if (!storedToken) {
    res.status(403).json({ error: "Token inválido" });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);

    // Rotación: eliminar el token usado y generar otro
    await storedToken.deleteOne();

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      storedToken.userId.toString(),
      (payload as any).email
    );

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(403).json({ error: "Token expirado o inválido" });
  }
};
