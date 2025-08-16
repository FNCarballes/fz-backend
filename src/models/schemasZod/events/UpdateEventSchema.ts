// src/models/UpdateEventSchema.ts
import { z } from "zod";

export const updateEventSchema = z.object({
  titleEvent: z.string().min(1).optional(),
  publicDescription: z.string().optional(),
  privateDescription: z.string().optional(),
  date: z.string().optional(), // o z.coerce.date() si querés transformarlo
  location: z.string().optional(),
  image: z.string().url().optional(),
  isSolidary: z.boolean().optional(),
});
