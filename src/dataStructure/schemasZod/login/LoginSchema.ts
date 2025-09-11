import {z} from "zod"
export const loginSchema = z.object({
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"),
    password: z.string().min(6, "Contraseña inválida"),
    deviceId: z.string().min(1, "DeviceId inválido"),
});
