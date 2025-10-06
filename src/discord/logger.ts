import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf } = format;

// Define custom log format
const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} - ${level}: ${message}`;
});

// Create and configure logger instance
export const logger = createLogger({
  level: "debug",
  format: combine(
    timestamp({ format: "HH:mm:ss DD/MM/YYYY" }), // Corrected date format
    myFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "discord.log" })
  ]
});
