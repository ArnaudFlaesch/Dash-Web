import * as winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(winston.format.json(), winston.format.colorize({ all: true })),
  level: 'debug',
  transports: [new winston.transports.Console()]
});

export default logger;
