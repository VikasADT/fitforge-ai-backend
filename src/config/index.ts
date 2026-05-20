import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('Missing JWT_SECRET in environment');
}

export const config = {
  port: Number(process.env.PORT || 5000),
  jwtSecret,
  databaseUrl: process.env.DATABASE_URL || '',
  openAiKey: process.env.OPENAI_API_KEY || '',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  nodeEnv: process.env.NODE_ENV || 'development'
};
