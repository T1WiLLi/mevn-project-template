import 'reflect-metadata';
import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { RouteRegistry } from './routes/Routes';
import connectDB from './config/DatabaseConfig';
import { logger } from './config/Logger';
import helmet from 'helmet';
import connectRedis from './config/RedisConfig';

dotenv.config();

class Server {
    public app: Express;
    private port: number;

    constructor(port?: number) {
        this.app = express();
        this.port = port || Number(process.env.PORT) || 5000;

        this.initializeHeaders();
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares() {
        this.app.set('trust proxy', true);

        const allowedOrigins = (process.env.CORS_ORIGIN || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        this.app.use(cors({
            origin: allowedOrigins.length ? allowedOrigins : true,
            credentials: true,
        }));

        this.app.use(express.json());
    }

    private initializeRoutes() {
        const routeRegistry = new RouteRegistry();
        routeRegistry.registerRoutes(this.app);
    }

    private initializeHeaders() {
        this.app.disable('x-powered-by');
        if (process.env.NODE_ENV === 'development') {
            this.app.use(helmet({
                contentSecurityPolicy: false, // Relax for HMR (VITE SERVER)
                crossOriginEmbedderPolicy: false,
            }));
        } else {
            this.app.use(helmet());
        }
    }

    public listen() {
        this.app.listen(this.port, () => {
            logger.info(`API listening on port ${this.port}`);
        });
    }
}

async function bootstrap() {
    try {
        await connectDB();
        await connectRedis();

        const server = new Server();
        server.listen();
    } catch (err) {
        console.error('Failed to start server', err);
        process.exit(1);
    }
}

bootstrap();
