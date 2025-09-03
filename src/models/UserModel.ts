// models/User.ts
import mongoose from "mongoose";
import { IUser } from "../types/userTypes";

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  refreshToken: { type: String, required: true },
  lastLogin: { type: Date, default: Date.now },
  userAgent: { type: String }, // opcional: navegador, versión app, etc.
});


export const userSchema = new mongoose.Schema({
  googleId: { type: String },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  identify: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photos: [{ type: String }],
  eventRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "EventRequest" }],
  devices: [deviceSchema]
});

export type IUserDocument = IUser & Document;


export const UserModel = mongoose.model<IUserDocument>("User", userSchema);
