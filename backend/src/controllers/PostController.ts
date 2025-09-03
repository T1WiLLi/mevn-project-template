import { Controller, Get, Post, Body, Param } from 'routing-controllers';

@Controller('/posts')
export class PostController {

    @Get('/')
    getAll() {
        return {
            message: 'Get all posts',
            posts: [
                { id: 1, title: 'First Post', content: 'Content...' },
                { id: 2, title: 'Second Post', content: 'More content...' }
            ]
        };
    }

    @Get('/:id')
    getOne(@Param('id') id: string) {
        return {
            message: `Get post ${id}`,
            post: { id, title: 'Sample Post', content: 'Post content here...' }
        };
    }

    @Post('/')
    create(@Body() postData: any) {
        return {
            message: 'Post created successfully',
            data: postData
        };
    }
}