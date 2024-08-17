import { NextFunction, Request, RequestHandler, Response } from 'express';

export function handleAsync(
	handler: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
	return function (req: Request, res: Response, next: NextFunction): void {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}
