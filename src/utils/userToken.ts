import jwt from 'jsonwebtoken';

export const JWT_SECRET = '12345'; // Should be stored securely, however for testing purposes will make it public

export const generateToken = (role: string) => {
	const payload = { role: role };
	return jwt.sign(payload, JWT_SECRET);
};
