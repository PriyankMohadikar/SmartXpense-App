import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis, getSessionKey } from '../lib/redis';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Verify session still exists in Redis
    const sessionKey = getSessionKey(token);
    const session = await redis.get(sessionKey);
    if (!session) {
      res.status(401).json({ message: 'Session expired. Please login again.' });
      return;
    }

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
