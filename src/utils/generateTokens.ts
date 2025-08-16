// src/auth/utils/generateTokens.ts
import jwt from "jsonwebtoken";
import { RefreshTokenModel } from "../models/RefreshTokenModel";
import fs from "fs";
import path from "path";

const privateKey = fs.readFileSync(
  path.join(__dirname, "../../keys/private.key"),
  "utf-8"
);

export const generateTokens = async (
  userId: string,
  email: string,
  userAgent: string,
  ip: string,
  device: string = "unknown"
) => {
  const accessToken = jwt.sign({ id: userId, email }, privateKey, {
    algorithm: "RS256",
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign({ id: userId, email }, privateKey, {
    algorithm: "RS256",
    expiresIn: "7d",
  });

  // Guardar el refresh token en la DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshTokenModel.create({
    token: refreshToken,
    userId,
    expiresAt,
    userAgent: userAgent || "unknown",
    ip: ip || "unknown",
    device: device || userAgent || "unknown",
  });
  return { accessToken, refreshToken };
};
