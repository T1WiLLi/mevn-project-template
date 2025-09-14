import { createLogger, format, transports } from 'winston';

const addCallerContext = format((info) => {
    const stack = new Error().stack;
    if (stack) {
        const lines = stack.split('\n');
        const callerLine = lines[10] || lines[3];
        const match = callerLine.match(/at (.+?) \(/);
        info.context = match?.[1] || 'anonymous';
    } else {
        info.context = 'unknown';
    }
    return info;
});

export const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: format.combine(
        addCallerContext(),
        format.colorize(),
        format.timestamp({
            format: () => new Date().toLocaleTimeString('en-CA', {
                hour12: false,
                timeZone: 'America/Toronto',
            })
        }),
        format.printf(({ timestamp, level, message, context }) => `[${timestamp}] ${level}: ${context} => ${message}`)),
    transports: [
        new transports.Console()
    ],
});
