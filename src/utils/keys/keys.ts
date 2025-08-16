import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const privateKeyPath = process.env.PRIVATE_KEY_PATH!;
const publicKeyPath = process.env.PUBLIC_KEY_PATH!;

if (!privateKeyPath || !publicKeyPath) {
  throw new Error("Faltan las rutas a las claves RSA en variables de entorno");
}

const privateKey = fs.readFileSync(privateKeyPath, "utf8");
const publicKey = fs.readFileSync(publicKeyPath, "utf8");

export { privateKey, publicKey };
