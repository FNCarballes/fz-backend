import type { IEvent } from "../models/Events";

export function cleanEventDoc(doc: IEvent) {
  const ev = doc.toObject(); // o doc.toJSON()

  return {
    _id: ev._id,
    titleEvent: ev.titleEvent,
    publicDescription: ev.publicDescription,
    privateDescription: ev.privateDescription,
    date: ev.date,
    image: ev.image,
    location: ev.location,
    creationDate: ev.creationDate,
    creator: ev.creator,
    isSolidary: ev.isSolidary,

    // Como la virtual `participants` ya trae la subdocumento completo,
    // aquí sólo extraemos userId:
    participants: ev.participants?.map((p: any) => p.userId) || [],

    // Y requests virtuales pasadas a tu forma:
    requests:
      ev.requests.map((r: any) => ({
        requestId: r._id,
        status: r.status,
        user: r.userId,
      })) || [],
  };
}

export function parseBooleanQuery(value: any): boolean | undefined {
  if (value === undefined) return undefined;
  const v = String(value).toLowerCase().trim();
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined; // o lanzar error de validación
}