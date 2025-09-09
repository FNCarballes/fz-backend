// middleware/validate.ts
import type { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

// Middleware para validar body + query + params juntos
export function validate(schema: ZodType<any, any, any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
      console.log("📩 Validando body:", req.body);   // 👈 LOG
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

import { ZodTypeAny } from "zod";

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // normalizar arrays -> primer valor, trim, etc.
    const normalized = Object.fromEntries(
      Object.entries(req.query).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
    );
    Object.keys(normalized).forEach(k => {
      if (typeof normalized[k] === 'string') normalized[k] = (normalized[k] as string).trim();
    });

    const result = schema.safeParse(normalized);

    if (!result.success) {
      const issues = result.error.issues.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));
      res.status(400).json({ issues });
      return;
    }

    // ✔️ No reasignes req.query. Guardá en res.locals
    res.locals.validatedQuery = result.data;
    next();
  };
}

