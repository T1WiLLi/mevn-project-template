import { Express } from 'express';
import { UserController } from "../controllers/UserController";
import { useExpressServer, RoutingControllersOptions } from 'routing-controllers';
import { PostController } from '../controllers/PostController';
import { csrfMiddleware } from '../middlewares/csrf';

export class RouteRegistry {
    private controllers: Function[] = [
        UserController,
        PostController,
        // Add your controllers here
    ];

    private options: RoutingControllersOptions = {
        routePrefix: "/api",
        controllers: this.controllers,
        middlewares: [csrfMiddleware], // Add global middlewares
        interceptors: [], // Add global interceptors
        defaultErrorHandler: false, // Set to true if you want default error handling
    };

    public registerRoutes(app: Express) {
        useExpressServer(app, this.options);
        console.log(`Registered ${this.controllers.length} controller(s)`)
    }

    public addControllers(controllers: Function[]): RouteRegistry {
        this.controllers.push(...controllers);
        return this;
    }

    public setOptions(options: Partial<RoutingControllersOptions>): RouteRegistry {
        this.options = { ...this.options, ...options };
        return this;
    }
}