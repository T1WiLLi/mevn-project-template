export interface IAuthUser {
    id: string;
    roles: string[];
    permissions: string[];
    isAuthenticated: boolean;
    isMfaVerified?: boolean;
    metadata?: Record<string, any>;
}