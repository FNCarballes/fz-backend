// middleware/validate.ts
import type { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

// Middleware para validar body + query + params juntos
export function validate(schema: ZodType<any, any, any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      res.status(400).json({ issues });
      return;
    }

    // Asignamos los valores parseados al request
    const data = result.data as any;
    req.body = data.body;
    req.query = data.query;
    req.params = data.params;

    next();
  };
}


export function validateParams(schema: ZodType<any, any, any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));

      res.status(400).json({ errors });
      return;
    }

    req.params = result.data;
    next();
  };
}
