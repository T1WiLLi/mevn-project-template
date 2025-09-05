import { Controller, Get, Post, Put, Delete, Body, Param, HttpError } from 'routing-controllers';
import { User, UserModel } from '../models/User';
import serialize from '../utilities/Serializer';

@Controller('/users')
export class UserController {

    @Get('/')
    async getAll() {
        const users = await UserModel.find().select('-password').lean();
        return serialize(users);
    }

    @Get('/:id')
    async getOne(@Param('id') id: string) {
        const user = await UserModel.findById(id).select('-password').lean();
        if (!user) return { message: `User with id ${id} not found` };
        return serialize(user);
    }

    @Post('/')
    async create(@Body() userData: Partial<User>) {
        const user = await UserModel.create(userData);
        return { message: 'User created successfully', user: serialize(user) };
    }

    @Put('/:id')
    async update(@Param('id') id: string, @Body() userData: Partial<User>) {
        const user = await UserModel.findByIdAndUpdate(id, userData, { new: true, runValidators: true }).select('-password');
        if (!user) return { message: `User with id ${id} not found` };
        return { message: `User ${id} updated successfully`, data: user };
    }

    @Delete('/:id')
    async remove(@Param('id') id: string) {
        const user = await UserModel.findByIdAndDelete(id).select('-password');
        if (!user) return { message: `User with id ${id} not found` };
        return { message: `User ${id} deleted successfully` };
    }
}