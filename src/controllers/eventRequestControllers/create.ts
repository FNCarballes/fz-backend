// src/controllers/EventRequestController.ts
import { EventRequestModel } from "../../dataStructure/mongooseModels/EventRequestModel";
import { AuthRequest } from "../../dataStructure/types/express/Index";
import { CreateEventRequestInput } from "../../dataStructure/schemasZod/eventsRequest/EventRequestSchema";
import mongoose from "mongoose";
import { Response } from "express";
import { eventRequestsCreated } from "../../utils/monitoring/prometheus";
import { sendResponse } from "../../utils/helpers/apiResponse";
import { UserModel } from "../../dataStructure/mongooseModels/UserModel";
export const postEventRequestController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  let creatorId: string | null = null;
  let requestSavedId: string | null = null;
  let requestSavedStatus: string | null = null;
  const session = await mongoose.startSession();

  // mongoose.startSession() → abre una sesión en Mongo.
  // 
  // Sirve principalmente para transacciones y garantizar consistencia en operaciones múltiples.
  // 
  // Sin transacciones, no te aporta nada usarlo.
  try {
    await session.withTransaction(async () => {

      const userId = req.userId; // typed in AuthRequest
      const { eventId } = req.body as CreateEventRequestInput;
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "eventId inválido.",
        });
        return
      }

      const request = new EventRequestModel({ userId, eventId });
      const requestSaved = await request.save({ session });
      requestSavedId = requestSaved._id.toString();
      requestSavedStatus = requestSaved.status;
      //El { session } asegura que el guardado esté dentro de una transacción si la hay.
      await UserModel.findByIdAndUpdate(
        userId,
        { $addToSet: { eventRequestsSent: requestSaved._id } },
        { session } //$addToSet solo inserta en el array si el requestSaved._id no existe ya. Si existe, no lanza error ni modifica.
      );
      eventRequestsCreated.inc({ status: "success" }); // ✅ request OK

      // 2. Bring the event and its creator
      const event = await mongoose
        .model("Event")
        .findById(eventId)
        .populate("creator").session(session);
      if (event?.creator) {
        creatorId =
          typeof event.creator === "object" && "_id" in event.creator
            ? event.creator._id.toString()
            : String(event.creator);
      }
    })
    // ✅ Hasta acá, la transacción terminó bien.
    // Ahora puedo mandar la notificación FUERA de la sesión
    // if (creatorId && requestSavedId) {
    // await notifyUser(userId); Aca logica de notificaciones.
    // }

    // ✅ Respuesta al cliente
    sendResponse(res, {
      statusCode: 201,
      success: true,
      data: {
        requestId: requestSavedId,
        requestStatus: requestSavedStatus,
      },
    });


  } catch (error) {
    eventRequestsCreated.inc({ status: "error" });
  } finally {
    await session.endSession(); // ✅ libera recursos
  }
}



