// models/EventRequest.ts
import mongoose from "mongoose";

const eventRequestSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  eventId:   { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  status:    { type: String, enum: ["pending","accepted","rejected"], default: "pending" },
}, { timestamps: true });

export const EventRequestModel = mongoose.model("EventRequest", eventRequestSchema);
