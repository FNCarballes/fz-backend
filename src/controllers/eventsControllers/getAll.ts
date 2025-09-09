// src/controllers/eventsControllers/getAll.ts
import { Request, Response, NextFunction } from "express";
import { EventModel } from "../../models/EventsModel";
import { cleanEventDoc } from "../../utils/cleanEventDoc";
import { eventQuerySchema } from "../../models/schemasZod/events/eventQuerySchema";
import z from "zod"


type EventQueryInput = z.infer<typeof eventQuerySchema>;
interface RequestWithQuery extends Request {
  validatedQuery?: EventQueryInput;
}

export const getAllEventsController = async (req: RequestWithQuery,
  res: Response, next: NextFunction) => {
  try {
    const query = eventQuerySchema.parse(req.validatedQuery); // ⚠️ casteamos aquí con seguridad

    const { page, limit, isSolidary } = query;

    // 1) Filtrado booleano
    const mongoQuery: any = {};
    if (typeof isSolidary === "boolean") {
      mongoQuery.isSolidary = isSolidary;
    }

    // 2) Paginación
    const skip = (page - 1) * limit;
const maxLimit = 100;
const finalLimit = Math.min(limit, maxLimit);
    // 3) Conteo total
    const total = await EventModel.countDocuments(mongoQuery);

    // 4) Consulta con skip/limit
    const events = await EventModel.find(mongoQuery)
      .sort({ creationDate: -1 })
      .skip(skip)
      .limit(finalLimit)
      .populate("creator", "name surname")
      .populate({
        path: "participants",
        select: "userId status",
        populate: {
          path: "userId",
          model: "User",
          select: "name surname age location identify",
        },
      })
      .populate({
        path: "requestsForPopulate",
        select: "userId status _id",
        populate: {
          path: "userId",
          model: "User",
          select: "name surname",
        },
      }).lean(); // devuelve plain JS objects
    ;

    // 5) Devolver datos + metadata
    res.json({
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: events.map(cleanEventDoc),
    });
  } catch (err) {
    next(err);
  }
}