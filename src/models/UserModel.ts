// models/User.ts
import mongoose from "mongoose";
import { IUser } from "../types/userTypes";

export const userSchema = new mongoose.Schema({
  googleId:         { type: String },
  name:             { type: String, required: true },
  surname:          { type: String, required: true },
  identify:         { type: String, required: true },
  age:              { type: Number, required: true },
  email:            { type: String, required: true, unique: true },
  password:         { type: String, required: true },
  photos:           [{ type: String }],
  eventRequestsSent:[{ type: mongoose.Schema.Types.ObjectId, ref: "EventRequest" }]
});

export const UserModel = mongoose.model<IUser>("User", userSchema);
