import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('Missing JWT_SECRET in environment');
}

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'OPENAI_API_KEY', 'FRONTEND_URL'];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length > 0 && process.env.NODE_ENV === 'production') {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const config = {
  port: Number(process.env.PORT || 5000),
  jwtSecret,
  databaseUrl: process.env.DATABASE_URL || '',
  openAiKey: process.env.OPENAI_API_KEY || '',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};
