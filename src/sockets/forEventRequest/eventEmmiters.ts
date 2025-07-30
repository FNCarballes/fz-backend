import { Server } from "socket.io";
import mongoose from "mongoose";

export const emitToCreator = async (
  io: Server,
  eventId: string,
  type: "request:created" | "request:updated" | "request:deleted",
  payload: any
) => {
  const event = await mongoose.model("Event").findById(eventId).populate("creator");
  if (!event || !event.creator) return;

  const creatorId = event.creator._id.toString();
  io.to(creatorId).emit(type, payload);
  console.log(`📢 ${type} emitido a ${creatorId}`);
};

export const emitToUser = (
  io: Server,
  userId: string,
  type: "request:statusChanged",
  payload: any
) => {
  io.to(userId).emit(type, payload);
  console.log(`🔔 ${type} emitido a ${userId}`);
};
