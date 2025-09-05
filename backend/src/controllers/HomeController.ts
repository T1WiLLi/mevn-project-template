import { Controller, Get } from "routing-controllers";

@Controller()
export class HomeController {

    @Get('/')
    index() {
        return {
            message: 'This is from the backend!',
        };
    }
}
