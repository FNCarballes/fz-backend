/* //authGoogle.ts
import { OAuth2Client } from "google-auth-library";
import { Request, Response } from "express";
import { UserModel } from "../models/UserModel";
import jwt from "jsonwebtoken";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const loginWithGoogle = async (req: Request, res: Response): Promise<any> => {
    const { id_token } = req.body;
  
    if (!id_token) {
      return res.status(400).json({ error: "Token de Google no recibido" });
    }
  
    try {
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
  
      const payload = ticket.getPayload();
      if (!payload) throw new Error("Token inválido");
  
      const { email, name, sub: googleId } = payload;
  
      // Buscar o crear usuario
      let user = await UserModel.findOne({ email });
      if (!user) {
        user = new UserModel({ email, userName: name, googleId });
        await user.save();
      }
  
      // Generar JWT propio (opcional)
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );
  
      res.status(200).json({
        token,
        userId: user._id,
        userName: user.userName,
      });
    } catch (error) {
      console.error("Google login error:", error);
      res.status(401).json({ error: "Token de Google inválido" });
    }
  }; */