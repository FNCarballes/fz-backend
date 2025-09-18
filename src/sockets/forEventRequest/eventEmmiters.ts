// src/socket/eventEmitters.ts
import { getIo } from "../indexSocket";
import { logger } from "../../utils/logger/logger";
import { EventModel } from "../../dataStructure/mongooseModels/EventsModel";

export const emitToCreator = async (
  eventId: string,
  type: "request:created" | "request:updated" | "request:deleted",
  payload: any
) => {
  const event = await EventModel.findById(eventId).populate("creator");
  if (!event || !event.creator) return;

  const creatorId = event.creator._id.toString();
  getIo().to(creatorId).emit(type, payload);
  logger.info(`📢 ${type} emitido a ${creatorId}`);
};

export const emitToUser = (
  userId: string,
  type: "request:statusChanged",
  payload: any
) => {
  getIo().to(userId).emit(type, payload);
  logger.info(`🔔 ${type} emitido a ${userId}`);
};

export const emitToAll = (type: string, payload: any) => {
  getIo().emit(type, payload);
  logger.info(`🌍 ${type} emitido a TODOS`);
};
