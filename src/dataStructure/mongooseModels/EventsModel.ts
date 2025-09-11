  // models/Event.ts
  import mongoose, { Document, Types } from "mongoose";

  // 1️⃣ Define una interfaz TypeScript
  export interface IEvent extends Document {
    _id: Types.ObjectId; // ✅ Mongoose crea un _id automáticamente
    titleEvent: string;
    publicDescription: string;
    privateDescription: string;
    date: Date;
    image?: string;
    location: string;
    creationDate: Date;
    creator: Types.ObjectId | {
      _id: Types.ObjectId;
      name: string;
      surname: string;
      email: string;
      age: number;
      location: string;
      identify: string;
    };
    isSolidary: boolean;

  // Virtual populate para participantes aceptados
  participants: Array<{
    userId: {
      _id: Types.ObjectId;
      name: string;
      surname: string;
      email: string;
      age: number;
      location: string;
      identify: string;
    };
    status: string;
  }>;

  // Virtual populate para todas las requests
  requests: Array<{
    _id: Types.ObjectId;
    status: string;
    userId: {
      _id: Types.ObjectId;
      name: string;
      surname: string;
      email: string;
    };
  }>;
}

const eventSchema = new mongoose.Schema({
  titleEvent:         { type: String, required: true },
  publicDescription:  { type: String, required: true },
  privateDescription: { type: String, required: true },
  date:               { type: Date, required: true },
  image:              { type: String },
  location:           { type: String, required: true },
  creationDate:       { type: Date, default: Date.now },
  creator:            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isSolidary: { type: Boolean, required: true, default: false },
  requests:    [{ type: mongoose.Schema.Types.ObjectId, ref: "EventRequest" }]
}, {
  toObject: { virtuals: true },
  toJSON:   { virtuals: true }
});

// Virtual populate: todos los EventRequest con status 'accepted'
eventSchema.virtual("participants", {
  ref:         "EventRequest",
  localField:  "_id",
  foreignField:"eventId",
  justOne:     false,
  match:       { status: "accepted" }
});
// Virtual populate: solicita todos los EventRequest (sin filtro de status)
eventSchema.virtual("requestsForPopulate", {
  ref:         "EventRequest",
  localField:  "_id",
  foreignField:"eventId",
  justOne:     false,
});

export const EventModel = mongoose.model<IEvent>("Event", eventSchema);

