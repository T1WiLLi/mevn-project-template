import { Controller, Get, Post, Put, Delete, Body, Param, HttpError } from 'routing-controllers';
import { User, UserModel } from '../models/User';
import serialize from '../utilities/Serializer';
import { Authorize } from '../auth/decorators/Authorize';
import Permissions from '../auth/Permissions';

@Controller('/users')
export class UserController {

    @Get('/')
    @Authorize({ permissions: [Permissions.User.READ] })
    async getAll() {
        const users = await UserModel.find().select('-password').lean();
        return serialize(users);
    }

    @Get('/:id')
    @Authorize({ permissions: [Permissions.User.READ] })
    async getOne(@Param('id') id: string) {
        const user = await UserModel.findById(id).select('-password').lean();
        if (!user) return { message: `User with id ${id} not found` };
        return serialize(user);
    }

    @Post('/')
    @Authorize({ permissions: [Permissions.User.WRITE] })
    async create(@Body() userData: Partial<User>) {
        const user = await UserModel.create(userData);
        return { message: 'User created successfully', user: serialize(user) };
    }

    @Put('/:id')
    @Authorize({ permissions: [Permissions.User.UPDATE] })
    async update(@Param('id') id: string, @Body() userData: Partial<User>) {
        const user = await UserModel.findByIdAndUpdate(id, userData, { new: true, runValidators: true }).select('-password');
        if (!user) return { message: `User with id ${id} not found` };
        return { message: `User ${id} updated successfully`, data: user };
    }

    @Delete('/:id')
    @Authorize({ permissions: [Permissions.User.DELETE] })
    async remove(@Param('id') id: string) {
        const user = await UserModel.findByIdAndDelete(id).select('-password');
        if (!user) return { message: `User with id ${id} not found` };
        return { message: `User ${id} deleted successfully` };
    }
}