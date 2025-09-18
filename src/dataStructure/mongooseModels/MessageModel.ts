// src/dataStructure/mongooseModels/MessageModel.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  clientMessageId?: string;   // idempotencia
  createdAt: Date;
  updatedAt: Date;
  readBy: mongoose.Types.ObjectId[];           // userIds que leyeron el mensaje
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    clientMessageId: {
      type: String,
      index: true,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

MessageSchema.index({ chatId: 1, createdAt: -1 }); // rápido fetch de historial
MessageSchema.index(
  { clientMessageId: 1, senderId: 1 },
  { unique: true, sparse: true }
); // idempotencia por sender + clientMessageId

export const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);
