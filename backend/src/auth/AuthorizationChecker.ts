import { Action } from 'routing-controllers';
import { AuthManager } from './AuthManager';
import { IAuthUser } from './interfaces/IAuthUser';
import { logger } from '../config/Logger';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function authorizationChecker(action: Action, roles: string[]): Promise<boolean> {
    if (isDevelopment) {
        logger.info('[Auth] AuthorizationChecker triggered');
        logger.info(`[Auth] Incoming request: ${action.request.method.toUpperCase()} ${action.request.path}`);
        logger.info('[Auth] Required roles/permissions:', roles);
    }

    const req = action.request;

    const provider = AuthManager.getProvider();

    if (isDevelopment) {
        logger.info(`[Auth] Using provider: ${provider.constructor.name}`);
    }

    const user: IAuthUser | null = await provider.getUser(req);

    if (isDevelopment) {
        logger.info('[Auth] Authenticated user:', user);
    }

    if (!user || !user.isAuthenticated) {
        logger.warn(`[Auth] Authentication failed for ${action.request.method} ${action.request.path}`);
        return false;
    }

    if (!roles || roles.length === 0) {
        if (isDevelopment) {
            logger.info('[Auth] No specific roles required, user is authenticated');
        }
        (req as any).user = user;
        return true;
    }

    const userRolesAndPermissions = [...user.roles, ...user.permissions];
    const hasAccess = roles.some(requirement =>
        userRolesAndPermissions.includes(requirement)
    );

    if (isDevelopment) {
        logger.info(`[Auth] User roles: ${user.roles.join(', ')}`);
        logger.info(`[Auth] User permissions: ${user.permissions.join(', ')}`);
        logger.info(`[Auth] Access granted: ${hasAccess}`);
    }

    if (hasAccess) {
        if (isDevelopment) {
            logger.info('[Auth] Authorization successful');
        }
        (req as any).user = user;
        return true;
    }

    logger.warn(`[Auth] Access denied for user ${user.id} - insufficient privileges. Required: [${roles.join(', ')}], User has: [${userRolesAndPermissions.join(', ')}]`);
    return false;
}