// src/controllers/EventRequestController.ts
import { EventRequestModel } from "../../models/EventRequestModel";
import { AuthRequest } from "../../types/express";
import { CreateEventRequestInput } from "../../models/schemasZod/eventsRequest/EventRequestSchema";
import mongoose from "mongoose";
import { Response, NextFunction } from "express";
import { logger } from "../../utils/logger/logger"
import { eventRequestsCreated } from "../../utils/monitoring/prometheus";
import { notifyUser } from "../../controllers/notificationsControllers/notificationController";
import { NotificationModel } from "../../models/notifications/NotificationModel";

export const postEventRequestController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId; // typed in AuthRequest

    const { eventId } = req.body as CreateEventRequestInput;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      eventRequestsCreated.inc({ status: "invalid_eventId" });
      res.status(400).json({ message: "eventId inválido." });
      return;
    }

    const existing = await EventRequestModel.findOne({ userId, eventId });
    if (existing) {
      eventRequestsCreated.inc({ status: "duplicate" });
      res
        .status(409)
        .json({ message: "Ya existe una solicitud para este evento." });
      return;
    }

    const request = new EventRequestModel({ userId, eventId });
    const requestSaved = await request.save();
    eventRequestsCreated.inc({ status: "success" }); // ✅ request OK
    // 1. acces to io
    const io = req.app.get("io");

    // 2. Bring the event and its creator
    const event = await mongoose
      .model("Event")
      .findById(eventId)
      .populate("creator");
if (event && event.creator) {
  const creatorId =
    typeof event.creator === "object" && "_id" in event.creator
      ? event.creator._id.toString()
      : event.creator.toString();

  notifyUser(creatorId, "request:created", {
    eventId,
    requestId: requestSaved._id,
    userId,
  });
  await NotificationModel.create({
  userId: creatorId,
  type: "request:created",
  payload: { eventId, requestId: requestSaved._id, userId },
});
}

    res.status(201).json({ id: requestSaved._id });
  } catch (error) {
    eventRequestsCreated.inc({ status: "error" }); // ❌ unexpected error
    next(error);
  }
};
