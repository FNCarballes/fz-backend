// src/dataStructure/mongooseModels/ChatModel.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
  type: "direct" | "group";
  participants: mongoose.Types.ObjectId[];   // userIds como ObjectId
  lastMessage?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // para grupos
  name?: string;
  avatar?: string;

  // helper para unicidad de chats "direct" (ids ordenados en string)
  canonicalParticipantsKey?: string;
}

const ChatSchema = new Schema<IChat>(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    participants: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      required: true,
      validate: {
        validator: (v: any[]) => Array.isArray(v) && v.length > 0,
        message: "participants must be a non-empty array",
      },
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    name: String,
    avatar: String,
    // campo auxiliar para hacer único un chat directo entre los mismos 2 users
    canonicalParticipantsKey: {
      type: String,
      index: true,
    },
  },
  { timestamps: true }
);

// pre-validate hook: para chats "direct" guardamos una key canonical (ids ordenados)
// así podemos crear un índice único parcial si queremos prevenir chats duplicados.
ChatSchema.pre("validate", function (next) {
  // `this` es documento
  if (this.type === "direct" && Array.isArray(this.participants)) {
    const key = this.participants.map((p: any) => String(p)).sort().join(":");
    this.canonicalParticipantsKey = key;
  }
  next();
});

// Índice parcial que evita crear dos chats direct con los mismos participantes
ChatSchema.index(
  { canonicalParticipantsKey: 1 },
  { unique: true, partialFilterExpression: { type: "direct" } }
);

export const ChatModel = mongoose.model<IChat>("Chat", ChatSchema);
