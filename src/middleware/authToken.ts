import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/userToken';

export const authenticateToken = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (token == null) return res.sendStatus(401); // if there's no token

	jwt.verify(token, JWT_SECRET, (err, decoded) => {
		if (err) return res.sendStatus(403); // token is no longer valid
		res.locals.user = decoded;
		next();
	});
};
