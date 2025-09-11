// src/utils/keys/keys.ts
//CHECKED
import fs from "fs";
import path from "path";
const privPath = process.env.PRIVATE_KEY_PATH || path.join(__dirname, "../../keys/private.key");
const pubPath = process.env.PUBLIC_KEY_PATH || path.join(__dirname, "../../keys/public.key");
if (!process.env.JWT_ISSUER) {
  throw new Error("JWT_ISSUER not set in env");
}
if (!fs.existsSync(privPath) || !fs.existsSync(pubPath)) {
  throw new Error("Private/Public key not found - check PRIVATE_KEY_PATH / PUBLIC_KEY_PATH");
}
export const privateKey = fs.readFileSync(privPath, "utf-8");
export const publicKey = fs.readFileSync(pubPath, "utf-8");
export const ISSUER = process.env.JWT_ISSUER;