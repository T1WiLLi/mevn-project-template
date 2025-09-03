// controllers/UserController.ts
import { Controller, Get, Post, Put, Delete, Body, Param, QueryParam } from 'routing-controllers';

@Controller('/users')
export class UserController {

    @Get('/')
    getAll(@QueryParam('page') page: number = 1, @QueryParam('limit') limit: number = 10) {
        return {
            message: 'Get all users',
            pagination: { page, limit }
        };
    }

    @Get('/:id')
    getOne(@Param('id') id: string) {
        return {
            message: `Get user ${id}`,
            user: { id, name: 'John Doe', email: 'john@example.com' }
        };
    }

    @Post('/')
    create(@Body() userData: any) {
        return {
            message: 'User created successfully',
            data: userData
        };
    }

    @Put('/:id')
    update(@Param('id') id: string, @Body() userData: any) {
        return {
            message: `User ${id} updated successfully`,
            data: userData
        };
    }

    @Delete('/:id')
    remove(@Param('id') id: string) {
        return {
            message: `User ${id} deleted successfully`
        };
    }
}