// import jwt from 'jsonwebtoken';
// import config from '@/config';
// import {Types} from 'mongoose';
// export const generateAccessToken=(userId:Types.ObjectId):string=>{
//     return jwt.sign({userId},config.JWT_ACCESS_TOKEN,{
//         expiresIn:config.ACCESS_TOKEN_EXPIRY,
//         subject:'accessToken'
//     })
// };
// export const generateRefreshToken=(userId:Types.ObjectId):string=>{
//     return jwt.sign({userId},config.JWT_REFRESH_TOKEN,{
//         expiresIn:config.REFRESH_TOKEN_EXPIRY,
//         subject:'refreshToken'
//     })
// };
import jwt from 'jsonwebtoken';
import config from '../config';

// الآن userId ممكن يكون string أو number حسب تعريف الـ id في PostgreSQL
export const generateAccessToken = (userId: string | number): string => {
  return jwt.sign(
    { userId: userId.toString() }, // نحول الرقم إلى نص لأن jwt يتعامل مع نصوص في الـ payload
    config.JWT_ACCESS_TOKEN,
    {
      expiresIn: config.ACCESS_TOKEN_EXPIRY,
      subject: 'accessToken'
    }
  );
};

export const generateRefreshToken = (userId: string | number): string => {
  return jwt.sign(
    { userId: userId.toString() },
    config.JWT_REFRESH_TOKEN,
    {
      expiresIn: config.REFRESH_TOKEN_EXPIRY,
      subject: 'refreshToken'
    }
  );
};
