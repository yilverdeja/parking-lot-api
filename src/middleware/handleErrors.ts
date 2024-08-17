import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';

export const handleErrors = async (
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (err instanceof AppError) {
		res.status(err.status).json({
			message: err.message,
		});
	} else {
		// console.error(err);
		res.status(500).json({
			message: 'Internal Server Error',
		});
	}
};
