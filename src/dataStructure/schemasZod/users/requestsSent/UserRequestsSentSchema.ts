// models/schemas/UserEventRequestSentSchema.ts
import { z } from "zod";

// Regex para ObjectId de MongoDB (24 caracteres hexadecimales)
const objectIdRegex = /^[a-f\d]{24}$/i;

export const userRequestSentSchema = z.object({
    requestId: z
      .string()
      .regex(objectIdRegex, { message: "requestId debe ser un ObjectId válido" }),
});
