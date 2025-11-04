import type { CorsOptions } from 'cors';
import config from './index';
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (
      config.NODE_ENV === 'development' ||
      !origin ||
      config.WHITELIST_ORIGINS.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('CORS ERROR: Origin not allowed'));
    }
  },
  credentials: true,
};

export default corsOptions;
