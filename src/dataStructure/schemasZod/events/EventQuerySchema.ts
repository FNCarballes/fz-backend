// src/models/schemasZod/events/eventQuerySchema.ts
import { z } from "zod";

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isSolidary: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const v = val.toLowerCase();
      if (v === "true" || v === "1") return true;
      if (v === "false" || v === "0") return false;
    }
    return undefined; // descarta valores raros
  }, z.boolean().optional()),
});
