// models/EventRequest.ts
import mongoose from "mongoose";

const eventRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
}, { timestamps: true });
//Un mismo userId no puede tener más de un request para el mismo eventId.
eventRequestSchema.index({ userId: 1, eventId: 1 }, { unique: true });
export const EventRequestModel = mongoose.model("EventRequest", eventRequestSchema);
