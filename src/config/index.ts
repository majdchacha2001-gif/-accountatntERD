import dotenv from 'dotenv';
import type ms from 'ms'
dotenv.config();
const config={
    PORT:process.env.PORT||3001,
    NODE_ENV:process.env.NODE_ENV,
    WHITELIST_ORIGINS:['http://localhost:5173','http://localhost:5174','https://am-accounting-soft.netlify.app','https://am-accounting-soft.netlify.app/'],
    DB_HOST:process.env.DB_HOST,
    DB_PORT:process.env.DB_PORT,
    DB_USERNAME:process.env.DB_USERNAME,
    DB_PASSWORD:process.env.DB_PASSWORD,
    DB_NAME:process.env.DB_NAME,
    LOG_LEVEL:process.env.LOG_LEVEL|| "info",
    JWT_ACCESS_TOKEN:process.env.JWT_ACCESS_TOKEN!,
    JWT_REFRESH_TOKEN:process.env.JWT_REFRESH_TOKEN!,
    ACCESS_TOKEN_EXPIRY:process.env.ACCESS_TOKEN_EXPIRY as ms.StringValue,
    REFRESH_TOKEN_EXPIRY:process.env.REFRESH_TOKEN_EXPIRY as ms.StringValue
}
export default config