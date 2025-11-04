// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import config from '@/config';

// interface JwtPayload {
//   userId: string;
//   iat: number;
//   exp: number;
//   sub: string;
// }

// // Extend request to allow .user property
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: string;
//       };
//     }
//   }
// }

// export const verifyAccessToken = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     res.status(401).json({ message: 'Access token missing or invalid' });
//     return; // 👈 مهم جدًا
//   }

//   const token = authHeader.split(' ')[1];

//   try {
//     const decoded = jwt.verify(token, config.JWT_ACCESS_TOKEN) as JwtPayload;
//     req.user = { id: decoded.userId };
//     next(); // 👈 تابع للتنفيذ
//   } catch (err) {
//     res.status(403).json({ message: 'Access token is invalid or expired' });
//     return; // 👈 مهم جدًا
//   }
// };
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
  sub: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export const verifyAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Access token missing or invalid' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_TOKEN) as JwtPayload;
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    res.status(403).json({ message: 'Access token is invalid or expired' });
    return;
  }
};
