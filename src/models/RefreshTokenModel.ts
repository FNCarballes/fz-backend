import mongoose, { Schema, Document } from "mongoose";

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  userAgent: string;
  ip: string;
  createdAt: Date;
    device: string;

}
const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  userAgent: { type: String, required: true },
  ip: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  device: { type: String, required: true }, // ⬅️ obligatorio para evitar inconsistencias

});
export const RefreshTokenModel = mongoose.model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema
);
