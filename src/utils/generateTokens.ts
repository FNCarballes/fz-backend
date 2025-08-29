// src/auth/utils/generateTokens.ts
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import crypto from "crypto";

const privateKey = fs.readFileSync(
  path.join(__dirname, "../../keys/private.key"),
  "utf-8"
);

export const generateTokens = async (userId: string, email: string) => {


  // Access token
  const accessToken = jwt.sign(
    { userId, email }, // payload
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: "1h",
      subject: userId, // `sub` en JWT
    }
  );
  const jti = crypto.randomUUID();
  // Refresh token
  const refreshToken = jwt.sign({ userId, email, jti }, privateKey, { algorithm: "RS256", expiresIn: "30d", subject: userId });
  return { accessToken, refreshToken, jti };
};
