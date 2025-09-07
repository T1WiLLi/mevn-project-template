import { Action } from 'routing-controllers';
import { AuthManager } from './AuthManager';
import { IAuthUser } from './interfaces/IAuthUser';

export async function currentUserChecker(action: Action): Promise<IAuthUser | null> {
    const req = action.request;

    if ((req as any).user) {
        return (req as any).user;
    }

    const provider = AuthManager.getProvider();
    const user: IAuthUser | null = await provider.getUser(req);

    if (user && user.isAuthenticated) {
        return user;
    }

    return null;
}