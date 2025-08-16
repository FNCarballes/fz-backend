import { Request } from "express";

export interface AuthRequest<
  P = {}, 
  ResBody = any, 
  ReqBody = any, 
  ReqQuery = {}
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  userId?: string;
  eventId?: string;
  email?: string;
  role?: string;
}
