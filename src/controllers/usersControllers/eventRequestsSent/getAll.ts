import { NextFunction, Response } from "express";
import { UserModel } from "../../../dataStructure/mongooseModels/UserModel";
import { AuthRequest } from "../../../dataStructure/types/express/Index";
import { sendResponse } from "../../../utils/helpers/apiResponse";
export const getEventRequestsSentController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Falta userId."
    });
    return;
  }

  try {
    const user = await UserModel.findById(userId).populate(
      "eventRequestsSent",
      "eventId titleEvent status"
    );

    if (!user) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Usuario no encontrado."
      });
      return;
    }

    sendResponse(res, {
      statusCode: 200,
      success: false,
      data: user.eventRequestsSent
    });
    return;
  } catch (error) {
    next(error)
  }
}