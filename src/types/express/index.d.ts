import { Request } from "express";
import { ObjectId } from "mongoose";
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
