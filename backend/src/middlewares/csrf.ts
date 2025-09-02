import { Request, Response, NextFunction } from 'express';
import Cookies from 'cookies';
import crypto from 'crypto';

const EXCLUDED_PATHS: string[] = [];

export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
    const cookies = new Cookies(req, res);
    const method = req.method.toUpperCase();

    if (EXCLUDED_PATHS.includes(req.path)) {
        return next();
    }

    if (['GET', 'HEAD'].includes(method)) {
        const token = crypto.randomBytes(32).toString('hex');
        cookies.set('_csrf', token, {
            httpOnly: false,
            secure: req.secure,
            sameSite: 'strict',
            path: '/',
        });
        return next();
    }

    if (!['OPTIONS'].includes(method)) {
        const tokenFromCookie = cookies.get('_csrf');
        const tokenFromRequest =
            req.headers['x-csrf-token'] as string ||
            req.body?.csrf_token ||
            req.query?.csrf_token;

        if (!tokenFromCookie || tokenFromCookie !== tokenFromRequest) {
            return res.status(403).json({ error: 'Invalid or missing CSRF token' });
        }
    }

    next();
}
