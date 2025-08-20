import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';

export const requestMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  
    const scope = Sentry.getCurrentScope();
    scope.setContext("request", {
      id: requestId,
      url: req.originalUrl,
      method: req.method
    });
    scope.setTag("request_id", requestId);
  
    next();
};
