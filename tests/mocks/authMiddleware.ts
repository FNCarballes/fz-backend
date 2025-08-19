// tests/mocks/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // ObjectId válido generado en runtime
  (req as any).userId = new mongoose.Types.ObjectId();
  next();
};
