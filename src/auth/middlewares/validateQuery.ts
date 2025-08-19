import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export function validateQuery(schema: ZodType<any, any, any>) {
  return (req: Request & { validatedQuery?: any }, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const issues = result.error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
        code: e.code,
      }));
      res.status(400).json({ issues });
      return;
    }

    req.validatedQuery = result.data; // ✅ guardamos aparte
    next();
  };
}
