//src/controllers/usersControllers/loginControllers/refreshTokenController
import { publicKey } from "../../../utils/keys/keys";  // ajusta ruta según estructura
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { generateTokens } from "../../../utils/helpers/generateTokens";
import { RefreshTokenModel } from "../../../dataStructure/mongooseModels/RefreshTokenModel";
import { sendResponse } from "../../../utils/helpers/apiResponse";
import { z } from "zod";
import bcrypt from "bcrypt";
const schema = z.object({
  refreshToken: z.string().min(20),
  deviceId: z.string().min(1),
});

export const refreshTokenController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Mala solicitud."
    });
    return;
  }
  const { refreshToken, deviceId } = parsed.data;
  try {
    const decoded = jwt.verify(refreshToken, publicKey, {
      algorithms: ["RS256"],
      issuer: process.env.JWT_ISSUER,
      audience: "mobile",
    }) as JwtPayload & { jti?: string, sub?: string};

    const userId = decoded.sub;
    if (!userId || !decoded.jti) {
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Tokne inválido."
      });
      return;
    }

    const session = await RefreshTokenModel.findOne({
      userId,
      deviceId,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      // No hay sesión activa -> posible reuso del token
      // Medida: revocar todas las sesiones del usuario y forzar re-login.
      await RefreshTokenModel.updateMany({ userId }, { $set: { revokedAt: new Date() } });
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Token inválido o reuso detectado - cerrá sesion en todos los dispositivos."
      });
      return;
    }


    const isMatch = await bcrypt.compare(String(decoded.jti), session.tokenHash);
    if (!isMatch) {
      // Reuso o manipulación: revocar todas sesiones
      await RefreshTokenModel.updateMany({ userId }, { $set: { revokedAt: new Date() } });
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Token inválido (reuso detectado)."
      });
      return;
    }

    // Revocación atómica para evitar carreras
    const updated = await RefreshTokenModel.updateOne(
      { _id: session._id, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
    if (updated.modifiedCount === 0) {
      sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "Token ya rotado."
      });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken, jti } = await generateTokens(userId);

    const jtiHash = await bcrypt.hash(jti, 10); // cost: 10 (ajustar según CPU)
    const userAgent = String(req.headers["user-agent"] || "unknown");
    const ip = req.ip;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30d

    // Generar nuevos tokens
    const newSession = await RefreshTokenModel.create({
      userId,
      tokenHash: jtiHash,
      deviceId,
      userAgent,
      ip,
      expiresAt
    });
    await RefreshTokenModel.findByIdAndUpdate(session._id, { replacedBy: newSession._id });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: {accessToken, refresToken: newRefreshToken, expiresAt}
    });
    return;
    //Devuelve json para mobiles
  } catch (error) {
   next(error)
  }
};