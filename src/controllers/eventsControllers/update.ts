import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { EventModel } from "../../dataStructure/mongooseModels/EventsModel";
import { cleanEventDoc } from "../../utils/helpers/cleanEventDoc";
import { updateEventSchema } from "../../dataStructure/schemasZod/events/UpdateEventSchema";
import { sendResponse } from "../../utils/helpers/apiResponse";
export const updateEventController = async (req: Request<{ id: string }>,
  res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const event = await EventModel.findById(id);
    if (!event) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Evento no encontradp."
      });
      return;
    }

    if (event.creator.toString() !== userId.toString()) {
      sendResponse(res, {
        statusCode: 403,
        success: false,
        message: "No autorizado."
      });
      return;
    }

    // Validamos el body con Zod (esto lanza si hay error)
    const data = updateEventSchema.parse(req.body);

    // Aplicamos solo los campos válidos
    Object.assign(event, data);
    const updated = await event.save();

    const io = req.app.get("io") as SocketIOServer;
    io.emit("event:updated", cleanEventDoc(updated));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: cleanEventDoc(updated)
    });
  } catch (error) {
    next(error);
  }
}