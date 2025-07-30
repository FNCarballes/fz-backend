import { Request, Response, NextFunction } from "express";
import { EventModel } from "../../models/Events";
import { cleanEventDoc, parseBooleanQuery } from "../../utils/cleanEventDoc";

export const getAllEventsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) Filtrado booleano
    const isSolidary = parseBooleanQuery(req.query.isSolidary);
    const query: any = {};
    if (typeof isSolidary === "boolean") {
      query.isSolidary = isSolidary;
    }

    // 2) Paginación
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    // 3) Conteo total
    const total = await EventModel.countDocuments(query);

    // 4) Consulta con skip/limit
    const events = await EventModel.find(query)
      .sort({ creationDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("creator", "-password -__v")
      .populate({
        path: "participants",
        select: "userId status",
        populate: {
          path: "userId",
          model: "User",
          select: "name email surname age location identify",
        },
      })
      .populate({
        path: "requests",
        select: "userId status _id",
        populate: {
          path: "userId",
          model: "User",
          select: "name email surname",
        },
      });

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