//src/models/RefreshTokenModel
import mongoose, { Schema, Document } from "mongoose";

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId; 
  tokenHash: string;          // Nunca guardamos el token en claro
   deviceId: string;           // Identificador único del dispositivo/sesión
   userAgent: string;
     ip?: string;
   createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;           // Para invalidar sin borrar
  replacedBy?: mongoose.Types.ObjectId | null;
}
const refreshTokenSchema = new Schema<IRefreshToken>({
  tokenHash:  { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  deviceId:   { type: String, required: true },
  userAgent: { type: String, required: false },
  ip:         { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  revokedAt:  { type: Date },
  replacedBy: { type: Schema.Types.ObjectId, ref: "RefreshToken", default: null }
});

// Índices
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1, deviceId: 1, revokedAt: 1 });
// Solo una activa por device (opcional):
refreshTokenSchema.index(
  { userId: 1, deviceId: 1 },
  { unique: true, partialFilterExpression: { revokedAt: { $exists: false } } }
);

export const RefreshTokenModel = mongoose.model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema
);

