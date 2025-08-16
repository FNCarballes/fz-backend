import { Server } from "socket.io";
import mongoose from "mongoose";
import {logger} from "../../utils/logger/logger"
import {EventModel} from "../../models/EventsModel"; // o como tengas organizado

export const emitToCreator = async (
  io: Server,
  eventId: string,
  type: "request:created" | "request:updated" | "request:deleted",
  payload: any
) => {
  const event = await EventModel.findById(eventId).populate("creator");
  if (!event || !event.creator) return;

  const creatorId = event.creator._id.toString();
  io.to(creatorId).emit(type, payload);
  logger.info(`📢 ${type} emitido a ${creatorId}`);
};

export const emitToUser = (
  io: Server,
  userId: string,
  type: "request:statusChanged",
  payload: any
) => {
  io.to(userId).emit(type, payload);
  logger.info(`🔔 ${type} emitido a ${userId}`);
};

export const emitToAll = (
  io: Server,
  type: string,
  payload: any
) => {
  io.emit(type, payload);
  logger.info(`🌍 ${type} emitido a TODOS`);
};
