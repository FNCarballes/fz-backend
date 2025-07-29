// middleware/validate.ts
import type { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

export function validate(schema: ZodType<any, any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ejecutamos safeParse sobre el objeto completo
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      // ZodError tiene .issues, no .errors
      const issues = (result.error as ZodError).issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));
       res.status(400).json({ issues });
       return;
    }

    // Aquí TypeScript aún ve result.data como unknown,
    // así que hacemos un type assertion basado en tu schema.
    // Si tu schema es, por ejemplo, createEventSchema,
    // puedes hacer:
    //
    //    type Input = z.infer<typeof createEventSchema>;
    //    const data = result.data as Input;
    //
    // Pero para un middleware genérico, usar any:
    const data = result.data as any;

    req.body   = data.body;
    req.query  = data.query;
    req.params = data.params;
    next();
  };
}
