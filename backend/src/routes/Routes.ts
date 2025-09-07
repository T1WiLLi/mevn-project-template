import { Express } from 'express';
import { UserController } from "../controllers/UserController";
import { useExpressServer, RoutingControllersOptions } from 'routing-controllers';
import { PostController } from '../controllers/PostController';
import { CsrfMiddleware } from '../middlewares/CsrfMiddleware';
import { HomeController } from '../controllers/HomeController';
import { MongooseValidationErrorHandler } from '../errors/MongooseValidationHandler';
import { logger } from "../config/Logger";
import { GlobalExceptionHandler } from '../errors/GlobalExceptionHandler';
import { I18nMiddleware } from '../middlewares/I18nMiddleware';
import { useContainer } from 'class-validator';
import Container from 'typedi';
import AuthController from '../controllers/AuthController';
import { authorizationChecker } from '../auth/AuthorizationChecker';
import { currentUserChecker } from '../auth/CurrentUserChecker';

export class RouteRegistry {
    private controllers: Function[] = [
        HomeController,
        UserController,
        PostController,
        AuthController,
        // Add your controllers here
    ];

    // The order here is important!
    private middlewares: Function[] = [
        CsrfMiddleware,
        I18nMiddleware,
        MongooseValidationErrorHandler,
        GlobalExceptionHandler
    ]

    private options: RoutingControllersOptions = {

        routePrefix: "/api",
        controllers: this.controllers,
        middlewares: this.middlewares,
        interceptors: [],
        defaultErrorHandler: false,
        development: process.env.NODE_ENV === 'development',
        authorizationChecker: authorizationChecker,
        currentUserChecker: currentUserChecker
    };

    public registerRoutes(app: Express) {
        useContainer(Container);
        useExpressServer(app, this.options);
        logger.debug(`Registered ${this.controllers.length} controller(s)`);
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