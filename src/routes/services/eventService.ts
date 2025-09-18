// // src/services/eventService.ts
// import { EventModel } from "../../dataStructure/mongooseModels/EventsModel";

// export async function createEvent({
//   userId,
//   title,
//   description,
//   date,
// }: {
//   userId: string;
//   title: string;
//   description?: string;
//   date: Date;
// }) {
//   return EventModel.create({
//     title,
//     description,
//     date,
//     createdBy: userId,
//   });
// }

// export async function joinEvent({ eventId, userId }: { eventId: string; userId: string }) {
//   const event = await EventModel.findById(eventId);
//   if (!event) throw new Error("EVENT_NOT_FOUND");

//   if (event.attendees.includes(userId)) return event;

//   event.attendees.push(userId);
//   await event.save();

//   return event;
// }

// export async function leaveEvent({ eventId, userId }: { eventId: string; userId: string }) {
//   const event = await EventModel.findById(eventId);
//   if (!event) throw new Error("EVENT_NOT_FOUND");

//   event.attendees = event.attendees.filter((id) => id !== userId);
//   await event.save();

//   return event;
// }
