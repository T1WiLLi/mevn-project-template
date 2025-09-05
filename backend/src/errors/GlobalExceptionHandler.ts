import { Request, Response } from "express";
import { ExpressErrorMiddlewareInterface, HttpError, Middleware } from "routing-controllers";
import { logger } from '../config/Logger';

@Middleware({ type: 'after' })
export class GlobalExceptionHandler implements ExpressErrorMiddlewareInterface {
    error(error: any, request: Request, response: Response, next: (err?: any) => any): void {
        if (error instanceof HttpError) {
            logger.warn(`HTTP Error: ${error.name} - ${error.message}`);
            response.status(error.httpCode).json({
                message: error.message,
                status: error.httpCode,
                path: request.originalUrl
            });
            return;
        }

        logger.error(`Unhandled error: `, error);
        response.status(500).json({
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}