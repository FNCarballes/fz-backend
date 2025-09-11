// schemas/event.ts
import { z } from "zod";

const DateYMD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");


export const createEventSchema = z.object({
  titleEvent: z.string().min(1, { message: "titleEvent es requerido" }),  publicDescription: z.string().min(1),
  privateDescription: z.string().min(1),
  date: DateYMD,
  image: z.string().optional(),
  location: z.string().min(1),
  isSolidary: z.coerce.boolean().optional().default(false),
});


// Para tipar tu handler:
export type CreateEventInput = z.infer<typeof createEventSchema>;
