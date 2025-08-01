// schemas/event.ts
import { z } from "zod";

export const createEventSchema = z.object({
  body: z.object({
    titleEvent:         z.string().min(1),
    publicDescription:  z.string().min(1),
    privateDescription: z.string().min(1),
    date:               z.string().min(1),
    image:              z.string().optional(),
    location:           z.string().min(1),
    isSolidary:         z.boolean().optional().default(false),
  }),
  query:  z.object({}).optional(),
  params: z.object({}).optional(),
});

// Para tipar tu handler:
export type CreateEventInput = z.infer<typeof createEventSchema>["body"];
