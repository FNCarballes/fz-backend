// src/models/schemas/DeleteEventRequestSentSchema.ts
import { z } from "zod";
import mongoose from "mongoose";

export const deleteRequestSentSchema = z.object({
  requestId: z
    .string()
    .refine((id) => mongoose.Types.ObjectId.isValid(id), {
      message: "eventId inválido",
    }),
});
