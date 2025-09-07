import 'reflect-metadata';
import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { RouteRegistry } from './routes/Routes';
import connectDB from './config/DatabaseConfig';
import { logger } from './config/Logger';
import { AuthManager } from './auth/AuthManager';
import { JwtProvider } from './auth/provider/JwtProvider';
import Container from 'typedi';
import cookieParser from 'cookie-parser';

dotenv.config();

export class Server {
    public app: Express;
    private port: number;

    constructor(port?: number) {
        this.app = express();
        this.port = port || Number(process.env.PORT) || 5000;

        this.initializeMiddlewares();
        this.initializeDatabase();
        this.initializeRoutes();
        this.registerAuthentificationProvider();
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
        this.app.use(cookieParser());
    }

    private async initializeDatabase() {
        await connectDB();
    }

    private initializeRoutes() {
        const routeRegistry = new RouteRegistry();
        routeRegistry.registerRoutes(this.app);
    }

    private registerAuthentificationProvider() {
        AuthManager.registerProvider(Container.get(JwtProvider));
    }

    public listen() {
        this.app.listen(this.port, () => {
            logger.info(`API listening on port ${this.port}`);
        });
    }
}

const server = new Server();
server.listen();
