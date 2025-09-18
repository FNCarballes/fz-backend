// src/controllers/usersControllers/eventRequestsSent/create.ts
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { UserModel } from "../../../dataStructure/mongooseModels/UserModel";
import {logger} from "../../../utils/logger/logger"
import { sendResponse } from "../../../utils/helpers/apiResponse";
export const postEventRequestSentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.userId;
  const { requestId } = req.body;

  if (!userId || !requestId) {
    sendResponse(res, {
      statusCode: 400, 
      success: false,
      message: "Falta requestId o token"
    });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "ID inválido"
    });
    return;
  }

  try {
    
    // Buscás al usuario en la base antes de modificarlo.
    const user = await UserModel.findById(userId);
    if (!user) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Usuario no encontrado"
      });
      return;
    }


    // 🚫 Si ya existe, devolver 409
    if (user.eventRequestsSent.some((id) => id.toString() === requestId)) {
      sendResponse(res, {
        statusCode: 409,
        success: false,
        message: "El request ya fue agregado previamente."
      });
      return;
    }

    // ✅ Si no existe, agregarlo
    user.eventRequestsSent.push(requestId);
    await user.save();
    

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "mensaje"
    });
    return;
  } catch (error) {
  next(error)
  }
};
