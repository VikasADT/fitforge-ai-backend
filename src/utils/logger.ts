import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

const simpleFormat = printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), simpleFormat)
    })
  ]
});

const stream = {
  write: (message: string) => logger.info(message.trim())
};

export { stream as loggerStream };
export default logger;
