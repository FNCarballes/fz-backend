//types/AuthRequest
import { Request } from "express";
export interface AuthRequest extends Request {
  userId?: string;
  eventId?: string;
  email?: string;
  role?: string;
}
