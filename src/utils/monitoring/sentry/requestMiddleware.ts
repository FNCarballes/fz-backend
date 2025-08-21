//~/src/utils/monitoring/sentry/requestMiddleware
import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';


export const requestMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId =
    (req.headers["x-request-id"] as string) ?? crypto.randomUUID();
  
  Sentry.setTag("request_id", requestId);
  Sentry.setContext("request", {
    id: requestId,
    url: req.originalUrl,
    method: req.method,
  });

  next();
};