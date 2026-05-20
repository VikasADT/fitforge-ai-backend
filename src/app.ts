import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import logger, { loggerStream } from './utils/logger';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

dotenv.config();

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use(cors({
  origin: [config.frontendUrl],
  credentials: true
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: loggerStream }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadDirectory = path.resolve(process.cwd(), config.uploadDir);
const rootDirectory = path.resolve(process.cwd());
if (!uploadDirectory.startsWith(rootDirectory + path.sep) && uploadDirectory !== rootDirectory) {
  throw new Error('Invalid upload directory configured');
}

app.use(
  '/uploads',
  express.static(uploadDirectory, {
    dotfiles: 'deny',
    index: false,
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      }
    }
  })
);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? 'unknown'
  });
});

app.use('/api', routes);

app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
