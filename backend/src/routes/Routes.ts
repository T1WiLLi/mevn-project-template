import { Express, Request } from 'express';
import { UserController } from "../controllers/UserController";
import { useExpressServer, RoutingControllersOptions, getMetadataArgsStorage } from 'routing-controllers';
import { PostController } from '../controllers/PostController';
import { CsrfMiddleware } from '../middlewares/CsrfMiddleware';
import { HomeController } from '../controllers/HomeController';
import { MongooseValidationErrorHandler } from '../errors/MongooseValidationHandler';
import { logger } from "../config/Logger";
import { GlobalExceptionHandler } from '../errors/GlobalExceptionHandler';
import { I18nMiddleware } from '../middlewares/I18nMiddleware';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUi from 'swagger-ui-express';
import { RateLimitMiddleware } from '../middlewares/RateLimitMiddleware';

export class RouteRegistry {
    private controllers: Function[] = [
        HomeController,
        UserController,
        PostController,
        // Add your controllers here
    ];

    // The order here is important!
    private middlewares: Function[] = [
        RateLimitMiddleware,
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
        development: process.env.NODE_ENV === 'development'
    };

    public registerRoutes(app: Express) {
        useExpressServer(app, this.options);
        this.initSwagger(app);
        logger.debug(`Registered ${this.controllers.length} controller(s)`);
    }

    private initSwagger(app: Express) {
        if (process.env.NODE_ENV === 'development') {
            const storage = getMetadataArgsStorage();
            const spec = routingControllersToSpec(storage, { routePrefix: '/api' }, {
                info: { title: process.env.APP_NAME || 'API', version: '1.0.0' },
            });

            app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, {
                swaggerOptions: {
                    requestInterceptor: (req: Request) => {
                        req.headers['x-swagger-ui'] = 'true';
                        return req;
                    }
                }
            }));
        }
    }
}