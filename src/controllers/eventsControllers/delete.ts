// src/controllers/eventsControllers/delete.ts
import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { EventModel } from "../../dataStructure/mongooseModels/EventsModel";
import { AuthRequest } from "../../dataStructure/types/express/Index";
import { sendResponse } from "../../utils/helpers/apiResponse";
type DeleteEventParams = { id: string };

export const deleteEventController = async (req: AuthRequest<DeleteEventParams>, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Falta userId"
      });
      return;
    }
    const event = await EventModel.findById(id);
    if (!event) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Evento no encontrado."
      });
      return;
    }

    if (event.creator.toString() !== userId.toString()) {
     sendResponse(res, {
       statusCode: 403,
       success: false,
       message: "No autorizado"
     });
     return;
    }

    await event.deleteOne();

    const io = req.app.get("io") as SocketIOServer;
    io.emit("event:deleted", { id });

    sendResponse(res, {
      statusCode: 200,
      success: true,
    });
    return;
  } catch (err) {
    next(err);
  }
}