// src/models/UpdateEventSchema.ts
import { z } from "zod";
const DateYMD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

export const updateEventSchema = z.object({
  titleEvent: z.string().min(1).optional(),
  publicDescription: z.string().min(1).optional(),
  privateDescription: z.string().min(1).optional(),
  date: DateYMD.optional(),
  image: z.string().optional(),
  location: z.string().min(1).optional(),
  isSolidary: z.boolean().optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: "Body vacío" });