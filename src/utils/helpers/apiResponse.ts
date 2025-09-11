//src/utils/helpers/apiResponse.ts
import { Response } from "express";
import { ApiResponse } from "../../dataStructure/types/api/ApiResponse";

export function sendResponse<T>(
  res: Response,
  { statusCode, success, message, data }: ApiResponse<T>
): Response {
  return res.status(statusCode).json({
    statusCode,
    success,
    message,
    ...(data !== undefined && { data }), // solo incluye data si existe
  });
}