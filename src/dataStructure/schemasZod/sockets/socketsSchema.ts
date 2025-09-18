// ejemplo reducido
import { z } from 'zod';

export const sendMessageSchema = z.object({
  roomId: z.string().min(1),
  text: z.string().min(1).max(2000),
});

export function validate(schema: z.ZodTypeAny) {
  return (payload: unknown) => {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) throw new Error('INVALID_PAYLOAD');
    return parsed.data;
  };
}
