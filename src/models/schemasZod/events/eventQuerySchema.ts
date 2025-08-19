// src/models/schemasZod/events/eventQuerySchema.ts
import { z } from "zod";

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(20),
  isSolidary: z.coerce.boolean().optional(),
});
