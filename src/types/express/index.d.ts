import { Request } from "express";
import { ObjectId } from "mongoose";
import "express";
export interface AuthRequest<
  P = {}, 
  ResBody = any, 
  ReqBody = any, 
  ReqQuery = {}
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  userId?: ObjectId | string;
  eventId?: ObjectId | string;
  email?: string;
  role?: string;
}



declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}