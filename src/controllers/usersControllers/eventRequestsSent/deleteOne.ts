// src/controllers/usersControllers/eventRequestsSent/deleteOne.ts
import { Request, Response, NextFunction } from "express";
import { UserModel } from "../../../dataStructure/mongooseModels/UserModel";
import { sendResponse } from "../../../utils/helpers/apiResponse";
type DeleteUserParams = {
  requestId: string;
};

export const deleteEventRequestSentController = async (
  req: Request<DeleteUserParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = (req as any).userId;
  const { requestId } = req.params;

  if (!userId || !requestId) {
    res.status(400).json({ error: "userId y requestId son obligatorios" });
    return;
  }


  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Usuario no encontrado."
      });
      return;
    }

    // Verificamos si realmente existe en el array
    const exists = user.eventRequestsSent.some(
      (id) => id.toString() === requestId
    );

    if (!exists) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Solicitud no encontradaen el usuario."
      });
      return;
    }

    user.eventRequestsSent = user.eventRequestsSent.filter(
      (id) => id.toString() !== requestId
    );
    await user.save();

    res.status(200).json({ message: "Solicitud de evento eliminada" });
    sendResponse(res, {
      statusCode: 200,
      success: true,
    });
    return;
  } catch (error) {
    next(error)
  }
};
