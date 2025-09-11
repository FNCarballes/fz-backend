// src/controllers/eventsControllers/getAll.ts
import { Request, Response, NextFunction } from "express";
import { EventModel } from "../../dataStructure/mongooseModels/EventsModel";
import { cleanEventDoc } from "../../utils/helpers/cleanEventDoc";
import { eventQuerySchema } from "../../dataStructure/schemasZod/events/EventQuerySchema";
import z from "zod"
import { sendResponse } from "../../utils/helpers/apiResponse";
import { buildPagination } from "../../utils/helpers/pagination";
type EventQueryInput = z.infer<typeof eventQuerySchema>;
interface RequestWithQuery extends Request {
  validatedQuery?: EventQueryInput;
}

export const getAllEventsController = async (req: RequestWithQuery,
  res: Response, next: NextFunction) => {
  try {

    const { page, limit, isSolidary } = req.validatedQuery!;

    // 1) Filtrado booleano
    const mongoQuery: any = {};
    if (typeof isSolidary === "boolean") {
      mongoQuery.isSolidary = isSolidary;
    }

    // 2) Paginación
    const { skip, limit: finalLimit } = buildPagination(page, limit);

    // 3) Consulta con skip/limit
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

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: events.map(cleanEventDoc)
    });
  } catch (err) {
    next(err);
  }
}