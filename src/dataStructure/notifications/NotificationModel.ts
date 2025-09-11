// src/models/NotificationModel.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface NotificationDoc extends Document {
  userId: Types.ObjectId;  // 👈 usar ObjectId, no string
  type: string;
  payload: any;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<NotificationDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  payload: { type: Object, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const NotificationModel = mongoose.model<NotificationDoc>(
  "Notification",
  NotificationSchema
);
