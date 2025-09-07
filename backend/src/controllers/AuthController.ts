import { Request, Response } from "express";
import { Authorize } from "../auth/decorators/Authorize";
import { IAuthUser } from "../auth/interfaces/IAuthUser";
import { LoginRequest } from '../models/queryModel/LoginQueryModel';
import AuthService from '../services/AuthService';
import { Controller, Post, Body, Res, Get, CurrentUser, Req } from "routing-controllers";

@Controller('/auth')
export default class AuthController {
    private authService = new AuthService();

    @Post('/login')
    async login(
        @Body() loginData: LoginRequest,
        @Res() res: Response
    ): Promise<Response> {
        const result = await this.authService.login(loginData.email, loginData.password, res);

        if (!result.success) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: result.message
            });
        }

        return res.json({
            message: 'Login successful',
            user: result.user!
        });
    }

    @Get('/logout')
    @Authorize({ roles: ['user'] })
    async logout(
        @Res() res: Response,
        @CurrentUser() user: IAuthUser
    ): Promise<Response> {
        await this.authService.logout(user.id, res);

        return res.json({
            message: 'Logged out successfully'
        });
    }

    @Get('/me')
    @Authorize({ roles: ['user'] })
    async getCurrentUser(@CurrentUser() user: IAuthUser) {
        return {
            id: user.id,
            email: user.metadata?.email,
            name: user.metadata?.name,
            roles: user.roles,
            permissions: user.permissions,
            mfaVerified: user.isMfaVerified
        };
    }

    @Post('/refresh')
    async refreshToken(
        @Req() req: Request,
        @Res() res: Response
    ): Promise<Response> {
        const result = await this.authService.refreshToken(req, res);

        if (!result.success) {
            return res.status(401).json({
                error: 'Token refresh failed',
                message: result.message
            });
        }

        return res.json({
            message: 'Token refreshed successfully'
        });
    }
}