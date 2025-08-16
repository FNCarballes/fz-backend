// middleware/validate.ts
import type { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

// Middleware para validar body + query + params juntos
export function validate(schema: ZodType<any, any, any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      res.status(400).json({ issues });
      return;
    }

    req.body = result.data;
    next();
  };
}


export function validateParams(schema: ZodType<any, any, any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const issues = result.error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
        code: e.code,
      }));

      res.status(400).json({ issues }); // <-- unificado
      return;
    }

    req.params = result.data;
    next();
  };
}

