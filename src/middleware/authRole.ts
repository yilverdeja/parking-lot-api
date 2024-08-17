import { NextFunction, Request, Response } from 'express';

export const authorizeRoles = (...allowedRoles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = res.locals.user;

		if (!user || !allowedRoles.includes(user.role)) {
			return res.status(403).json({ message: 'Access denied' });
		}

		next();
	};
};
