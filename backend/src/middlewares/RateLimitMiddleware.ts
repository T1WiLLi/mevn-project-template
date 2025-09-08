import { NextFunction, Request, Response } from "express";
import { redisClient } from "../config/RedisConfig";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";

@Middleware({ type: 'before' })
export class RateLimitMiddleware implements ExpressMiddlewareInterface {
    private limiter = rateLimit({
        store: new RedisStore({
            sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        }),
        windowMs: 15 * 60 * 1000,
        max: (process.env.NODE_ENV === 'development' ? Number.MAX_VALUE : 100),
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) => {
            res.status(429).json({
                message: "Too many requests, please try again later."
            });
        },
    });

    use(req: Request, res: Response, next: NextFunction): void {
        this.limiter(req, res, next);
    }
}