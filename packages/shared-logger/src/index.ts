import pino from "pino";

// Define configuration based on environment
const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    service: process.env.SERVICE_NAME || "unknown-service",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
