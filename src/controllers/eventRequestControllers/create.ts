// src/controllers/EventRequestController.ts
import { EventRequestModel } from "../../dataStructure/mongooseModels/EventRequestModel";
import { AuthRequest } from "../../dataStructure/types/express/Index";
import { CreateEventRequestInput } from "../../dataStructure/schemasZod/eventsRequest/EventRequestSchema";
import mongoose from "mongoose";
import { Response, NextFunction } from "express";
import { eventRequestsCreated } from "../../utils/monitoring/prometheus";
import { notifyUser } from "../../controllers/notificationsControllers/notificationController";
import { NotificationModel } from "../../dataStructure/notifications/NotificationModel";
import { sendResponse } from "../../utils/helpers/apiResponse";

export const postEventRequestController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId; // typed in AuthRequest

    const { eventId } = req.body as CreateEventRequestInput;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "eventId inválido.",
      });
      return
    }

    const existing = await EventRequestModel.findOne({ userId, eventId });
    if (existing) {
        sendResponse(res, {
          statusCode: 409,
          success: false,
          message: "Ya existe una solicitud para este evento."
        });
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

    sendResponse(res, {
      statusCode: 201,
      success: true,
      data: requestSaved._id 
    });
    return;
  } catch (error) {
    eventRequestsCreated.inc({ status: "error" });
    next(error); // El middleware global maneja el formateo
  }
};
