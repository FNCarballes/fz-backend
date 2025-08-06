// src/auth/utils/generateTokens.ts
import jwt from "jsonwebtoken";
import { RefreshTokenModel } from "../models/RefreshTokenModel";

export const generateTokens = async (userId: string, email: string) => {
  const accessToken = jwt.sign({ id: userId, email }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });

  // Guardar el refresh token en la DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshTokenModel.create({ token: refreshToken, userId, expiresAt });

  return { accessToken, refreshToken };
};
