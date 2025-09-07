// auth/providers/JwtProvider.ts
import { Service } from 'typedi';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { IAuthProvider } from '../interfaces/IAuthProvider';
import { IAuthUser } from '../interfaces/IAuthUser';
import { logger } from '../../config/Logger';

@Service()
export class JwtProvider implements IAuthProvider {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
    private readonly COOKIE_NAME = 'auth_token';

    async getUser(req: Request): Promise<IAuthUser | null> {
        const isDevelopment = process.env.NODE_ENV === 'development';

        if (isDevelopment) {
            logger.info('Getting the token from cookies');
        }

        try {
            const token = req.cookies?.[this.COOKIE_NAME];

            if (!token) {
                if (isDevelopment) {
                    logger.info('No auth token found in cookies');
                }
                return null;
            }

            const decoded = jwt.verify(token, this.JWT_SECRET) as any;

            if (isDevelopment) {
                logger.info('Token decoded successfully:', {
                    userId: decoded.userId,
                    email: decoded.email,
                    roles: decoded.roles,
                    permissions: decoded.permissions
                });
            }

            const authUser: IAuthUser = {
                id: decoded.userId,
                roles: decoded.roles || [],
                permissions: decoded.permissions || [],
                isAuthenticated: true,
                isMfaVerified: decoded.mfaVerified || false,
                metadata: {
                    email: decoded.email,
                    name: decoded.name,
                }
            };

            return authUser;

        } catch (error: any) {
            if (isDevelopment) {
                logger.warn('JWT verification failed:', error.message);
            } else {
                logger.warn('JWT verification failed for request');
            }

            return null;
        }
    }
}