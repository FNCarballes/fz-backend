// models/schemas/CreateUserSchema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  surname: z.string().optional(),
  identify: z.string().optional(),
  age: z.coerce.number().int().min(0).max(120),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  photos: z.array(z.string().url()).optional(),
});
