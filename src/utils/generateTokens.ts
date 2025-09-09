// src/utils/generateTokens.ts
import jwt from "jsonwebtoken";
import { privateKey, ISSUER } from "./keys/keys";
import crypto from "crypto";


export const generateTokens = async (userId: string, audience = "mobile") => {
  if (!ISSUER) throw new Error("ISSUER not configured");
  const jti = crypto.randomUUID();
  const aud = "mobile";

  // Access token
  const accessToken = jwt.sign(
    {}, // payload, luego ver roles, permissions aqui
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: "1h",
      subject: userId,
      issuer: ISSUER,
      audience: aud,
      jwtid: jti
    }
  );

  // Refresh token
  const refreshToken = jwt.sign({}, privateKey, {
    algorithm: "RS256",
    expiresIn: "30d",
    subject: userId,
    issuer: ISSUER,
    audience: aud,
    jwtid: jti
  });

  return { accessToken, refreshToken, jti };
};
