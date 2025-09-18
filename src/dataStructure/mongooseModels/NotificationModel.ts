import mongoose, { Schema, Document } from "mongoose";
export const NotificationTypes = {
  EVENT_INVITE: "EVENT_INVITE",
  MESSAGE: "MESSAGE",
  SYSTEM: "SYSTEM",
  FRIEND_REQUEST: "FRIEND_REQUEST",
  OTHER: "OTHER",
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];

export interface NotificationDoc extends Document {
  _id: string;
  recipientId: mongoose.Types.ObjectId; // usuario que recibe la notificación
  senderId?: mongoose.Types.ObjectId;   // opcional: quién la originó
  type: NotificationType;

  title: string;        // título corto (ej: "Nueva invitación")
  message: string;      // cuerpo o texto principal
  data?: Record<string, any>; // payload extra (ej: { eventId: "...", url: "..." })

  read: boolean;        // si ya fue abierta/confirmada
  delivered: boolean;   // si ya fue enviada (push, mail, etc.)
  archived: boolean;    // si el usuario la ocultó/eliminó de su bandeja

  priority?: "low" | "normal" | "high"; // opcional, para colas/push

  createdAt: Date;
  updatedAt: Date;
}


const NotificationSchema = new Schema<NotificationDoc>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: Object.values(NotificationTypes),
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },

    read: { type: Boolean, default: false, index: true },
    delivered: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },

    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 })


export const NotificationModel = mongoose.model<NotificationDoc>(
  "Notification",
  NotificationSchema
);
