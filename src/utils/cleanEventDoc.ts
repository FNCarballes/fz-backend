// src/utils/cleanEventDoc.ts
import type { IEvent } from "../models/EventsModel";

function asPlain<T = any>(v: any): T {
  // Convierte un documento de Mongoose a objeto plano si tiene toObject()
  return (v && typeof v.toObject === "function") ? v.toObject() : v;
}

export function cleanEventDoc(doc: IEvent) {
  // Acepta doc de Mongoose o POJO
  const ev: any = asPlain(doc);

  // Si usaste el virtual, preferilo; si no, cae al campo físico
  const rawRequests: any[] =
    Array.isArray(ev.requestsForPopulate) ? ev.requestsForPopulate
    : Array.isArray(ev.requests) ? ev.requests
    : [];

  return {
    _id: ev._id,
    titleEvent: ev.titleEvent,
    publicDescription: ev.publicDescription,
    privateDescription: ev.privateDescription,
    date: ev.date,
    image: ev.image,
    location: ev.location,
    creationDate: ev.creationDate,

    // creator puede venir poblado (doc) o como ObjectId
    creator: asPlain(ev.creator),

    isSolidary: ev.isSolidary,

    // participants: nos quedamos con el user poblado si existe
    participants: Array.isArray(ev.participants)
      ? ev.participants
          .map((p: any) => asPlain(p?.userId) ?? null)
          .filter(Boolean)
      : [],

    // requests: normalizamos tanto docs poblados como ObjectIds planos
    requests: rawRequests.map((r: any) => {
      const rr = asPlain(r);
      const user = asPlain(rr?.userId) ?? null;
      const requestId =
        rr?._id ??
        (typeof rr === "string" ? rr : rr?.toString?.() ?? null);
      return { requestId, status: rr?.status ?? null, user };
    }),
  };
}
