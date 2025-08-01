import { z } from "zod";

export const createEventRequestSchema = z.object({
  eventId: z
    .string()
    .min(1, "El ID del evento es requerido.")
    .regex(/^[0-9a-fA-F]{24}$/, "ID de evento inválido (no es un ObjectId)."),
});

export type CreateEventRequestInput = z.infer<typeof createEventRequestSchema>;

export const updateEventRequestSchema = z
  .object({
    status: z.string(),
  })
  .refine(
    (data) => data.status === "accepted" || data.status === "rejected",
    {
      message: "El campo 'status' debe ser 'accepted' o 'rejected'.",
      path: ["status"],
    }
  );

export type UpdateEventRequestInput = z.infer<typeof updateEventRequestSchema>;

// 
// Si algún día actualizás a la forma moderna con Zod 3.21+, la forma más clara es:
// export const updateEventRequestSchema = z.object({
//   status: z.enum(["accepted", "rejected"]),
// });
// Sin opciones extras — Zod se encarga de devolver mensajes automáticos.



export const requestIdParamSchema = z.object({
  requestId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "El ID debe ser un ObjectId válido."),
});

export type RequestIdParamInput = z.infer<typeof requestIdParamSchema>;


const isValidObjectId = (value: string) =>
  /^[0-9a-fA-F]{24}$/.test(value);

export const deleteEventRequestSchema = z.object({
  requestId: z
    .string()
    .refine(isValidObjectId, {
      message: "Invalid ObjectId",
    }),
});