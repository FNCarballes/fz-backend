// src/utils/generateTokens.ts
import jwt from "jsonwebtoken";
import { privateKey, ISSUER } from "./keys/keys";
import crypto from "crypto";


export const generateTokens = async (userId: string, email: string, audience = "mobile") => {
  if (!ISSUER) throw new Error("ISSUER not configured");
  const jti = crypto.randomUUID();


  // Access token
  const accessToken = jwt.sign(
    { email }, // payload
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: "1h",
      subject: userId,
      issuer: ISSUER,
      audience,
      jwtid: crypto.randomUUID()
    }
  );

  // Refresh token
  const refreshToken = jwt.sign({ email }, privateKey, {
    algorithm: "RS256",
    expiresIn: "30d",
    subject: userId,
    issuer: ISSUER,
    audience,
    jwtid: jti
  });

  return { accessToken, refreshToken, jti };
};
