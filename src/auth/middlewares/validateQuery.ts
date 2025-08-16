import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export const validateQuery =
  (schema: ZodType<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        errors: result.error.issues.map((e) => ({
          path: e.path,
          message: e.message,
        })),
      });
      return;
    }
    req.query = result.data;
    next();
  };
