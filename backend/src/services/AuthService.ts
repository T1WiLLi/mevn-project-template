import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Permissions from "../auth/Permissions";

interface User {
    id: string;
    email: string;
    name: string;
    password: string;
    roles: string[];
    permissions: string[];
    mfaVerified?: boolean;
    isActive: boolean;
}

interface LoginResult {
    success: boolean;
    message: string;
    user?: {
        id: string;
        email: string;
        name: string;
        roles: string[];
        permissions: string[];
    };
}

interface RefreshResult {
    success: boolean;
    message: string;
}

export default class AuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
    private readonly REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';
    private readonly COOKIE_NAME = 'auth_token';
    private readonly REFRESH_COOKIE_NAME = 'refresh_token';

    public async login(email: string, password: string, res: Response): Promise<LoginResult> {
        try {
            if (!email || !password) {
                return {
                    success: false,
                    message: 'Email and password are required'
                };
            }

            const user = await this.findUserByEmail(email);

            if (!user) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }

            // Check if user is active
            if (!user.isActive) {
                return {
                    success: false,
                    message: 'Account is disabled'
                };
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }

            // Generate tokens
            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            // Set cookies
            this.setAuthCookies(res, accessToken, refreshToken);

            // Log login (optional)
            await this.logUserActivity(user.id, 'login');

            return {
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    roles: user.roles,
                    permissions: user.permissions
                }
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'An error occurred during login'
            };
        }
    }

    public async logout(userId: string, res: Response): Promise<void> {
        try {
            // Clear cookies
            res.clearCookie(this.COOKIE_NAME, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
            });

            res.clearCookie(this.REFRESH_COOKIE_NAME, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
            });

            // Log logout (optional)
            await this.logUserActivity(userId, 'logout');

            // Invalidate refresh token in database (recommended for security)
            await this.invalidateRefreshToken(userId);

        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    public async refreshToken(req: Request, res: Response): Promise<RefreshResult> {
        try {
            const refreshToken = req.cookies?.[this.REFRESH_COOKIE_NAME];

            if (!refreshToken) {
                return {
                    success: false,
                    message: 'Refresh token not found'
                };
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, this.REFRESH_SECRET) as any;

            // Get user
            const user = await this.findUserById(decoded.userId);

            if (!user || !user.isActive) {
                return {
                    success: false,
                    message: 'User not found or inactive'
                };
            }

            // Check if refresh token is still valid in database (optional but recommended)
            const isRefreshTokenValid = await this.isRefreshTokenValid(user.id, refreshToken);

            if (!isRefreshTokenValid) {
                return {
                    success: false,
                    message: 'Refresh token is invalid'
                };
            }

            // Generate new tokens
            const newAccessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);

            // Set new cookies
            this.setAuthCookies(res, newAccessToken, newRefreshToken);

            // Invalidate old refresh token
            await this.invalidateRefreshToken(user.id, refreshToken);

            return {
                success: true,
                message: 'Token refreshed successfully'
            };

        } catch (error) {
            console.error('Refresh token error:', error);
            return {
                success: false,
                message: 'Invalid refresh token'
            };
        }
    }

    private generateAccessToken(user: User): string {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                name: user.name,
                roles: user.roles,
                permissions: user.permissions,
                mfaVerified: user.mfaVerified || false
            },
            this.JWT_SECRET,
            {
                expiresIn: '15m', // Short-lived access token
                subject: user.id,
                issuer: 'your-app-name'
            }
        );
    }

    private generateRefreshToken(user: User): string {
        return jwt.sign(
            {
                userId: user.id,
                type: 'refresh'
            },
            this.REFRESH_SECRET,
            {
                expiresIn: '7d', // Long-lived refresh token
                subject: user.id,
                issuer: 'your-app-name'
            }
        );
    }

    private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            path: '/'
        };

        // Access token cookie (shorter expiry)
        res.cookie(this.COOKIE_NAME, accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        // Refresh token cookie (longer expiry)
        res.cookie(this.REFRESH_COOKIE_NAME, refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
    }

    // Database methods - replace with your actual database logic
    private async findUserByEmail(email: string): Promise<User | null> {
        // Pre-hash passwords for mock users
        const adminPasswordHash = await bcrypt.hash('password123', 10);
        const userPasswordHash = await bcrypt.hash('userpass', 10);

        const mockUsers: User[] = [
            {
                id: '1',
                email: 'admin@example.com',
                name: 'Admin User',
                password: adminPasswordHash,
                roles: ['admin', 'user'],
                permissions: Permissions.User.ALL,
                mfaVerified: false,
                isActive: true
            },
            {
                id: '2',
                email: 'user@example.com',
                name: 'Regular User',
                password: userPasswordHash,
                roles: ['user'],
                permissions: ['user:read'],
                mfaVerified: false,
                isActive: true
            }
        ];

        return mockUsers.find(user => user.email === email) || null;
    }

    private async findUserById(id: string): Promise<User | null> {
        // Mock implementation - replace with your database query
        // Example: return await this.userRepository.findById(id);

        const user = await this.findUserByEmail('admin@example.com'); // Mock
        return user?.id === id ? user : null;
    }

    private async logUserActivity(userId: string, activity: string): Promise<void> {
        // Optional: Log user activity
        // Example: await this.activityLogRepository.create({ userId, activity, timestamp: new Date() });
        console.log(`User ${userId} performed: ${activity} at ${new Date().toISOString()}`);
    }

    private async invalidateRefreshToken(userId: string, token?: string): Promise<void> {
        // Optional: Invalidate refresh token in database
        // This is recommended for better security
        // Example: await this.refreshTokenRepository.invalidate(userId, token);
        console.log(`Invalidating refresh token for user ${userId}`);
    }

    private async isRefreshTokenValid(userId: string, token: string): Promise<boolean> {
        // Optional: Check if refresh token exists and is valid in database
        // This prevents reuse of old tokens
        // Example: return await this.refreshTokenRepository.isValid(userId, token);
        return true; // Mock implementation
    }
}