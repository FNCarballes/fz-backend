// src/services/notificationService.ts
import { NotificationModel, NotificationDoc } from "../../dataStructure/mongooseModels/NotificationModel";
import { FilterQuery } from "mongoose";
export async function createNotification({
  recipientId,
  senderId,
  type,
  title,
  message,
  data,
}: {
  recipientId: string;
  senderId?: string;
  type: NotificationDoc["type"];
  title: string;
  message: string;
  data?: Record<string, any>;
}) {
  const notification = await NotificationModel.create({
    recipientId,
    senderId,
    type,
    title,
    message,
    data,
    read: false,
    delivered: false,
    archived: false,
  });
  return notification.toObject();
}

export async function markAsRead(notificationId: string, recipientId: string) {
  const notif = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, recipientId } as FilterQuery<NotificationDoc>,
    { read: true },
    { new: true }
  ).lean();
  if (!notif) throw new Error("NOTIFICATION_NOT_FOUND");
  return notif;
}

export async function getUserNotifications(recipientId: string, limit = 20) {
  return NotificationModel.find({ recipientId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
