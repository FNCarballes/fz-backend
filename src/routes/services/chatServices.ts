// src/services/chatService.ts
import { ChatModel } from "../../dataStructure/mongooseModels/ChatModel";
import { MessageModel } from "../../dataStructure/mongooseModels/MessageModel";
import mongoose from "mongoose";

// src/services/chatService.ts
export async function sendMessage({
  chatId,
  senderId,
  content,
  clientMessageId,
}: {
  chatId: string | mongoose.Types.ObjectId;
  senderId: string | mongoose.Types.ObjectId;
  content: string;
  clientMessageId?: string; // opcional para idempotencia
}) {
  // buscar chat y validar participante
  const chat = await ChatModel.findById(chatId).select("participants");
  if (!chat) throw new Error("CHAT_NOT_FOUND");

  // validar que sender sea participante del chat
  const isParticipant = chat.participants.some(
    (p) => String(p) === String(senderId)
  );
  if (!isParticipant) throw new Error("NOT_A_PARTICIPANT");

  // Idempotencia: evitar duplicados si clientMessageId ya existe (por el mismo sender)
  if (clientMessageId) {
    const existing = await MessageModel.findOne({
      clientMessageId,
      senderId,
      chatId,
    });
    if (existing) return existing.toObject();
  }

  // crear mensaje — timestamps manejará createdAt/updatedAt
  const message = await MessageModel.create({
    chatId,
    senderId,
    content,
    clientMessageId,
  });

  // actualizar lastMessage de forma más segura (findByIdAndUpdate atómico)
  await ChatModel.findByIdAndUpdate(chatId, { lastMessage: message._id });

  // devolver objeto plano (puedes popular sender si lo necesitás)
  return message.toObject();
}