import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
    Middleware,
    ExpressErrorMiddlewareInterface
} from 'routing-controllers';
import { logger } from '../config/Logger';
import { i18n } from '../config/i18n';

@Middleware({ type: 'after' })
export class MongooseValidationErrorHandler implements ExpressErrorMiddlewareInterface {
    error(error: any, _request: Request, response: Response, next: (err?: any) => any): void {
        if (error instanceof mongoose.Error.ValidationError) {
            logger.error('Mongoose validation error:', error);

            const errors = Object.fromEntries( // We need to translate the error key at runtime to be able to change language and have direct update
                Object.entries(error.errors).map(([key, value]: any) => {
                    const translationKey = value.message;
                    const translatedMessage = i18n.exists(translationKey)
                        ? i18n.t(translationKey, { lng: i18n.language }) : translationKey;
                    return [key, translatedMessage];
                })
            );

            response.status(400).json({
                message: 'Validation failed',
                errors
            });
            return;
        }

        if (error?.code === 11000) {
            logger.error('MongoDB duplicate key error:', error);

            const field = Object.keys(error.keyValue)[0];
            response.status(400).json({
                message: `Duplicate value for ${field}`,
                errors: { [field]: `${field} must be unique` }
            });
            return;
        }

        next(error);
    }
}
