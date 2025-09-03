import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import { RouteRegistry } from './routes/Routes';
import { csrfMiddleware } from './middlewares/csrf';

dotenv.config();

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 5000;

const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: allowed.length ? allowed : true,
    credentials: true,
}));

app.use(express.json());
connectDB();

const routeRegistry = new RouteRegistry();
routeRegistry.registerRoutes(app);

app.listen(PORT, () => {
    console.log(`API listening on ${PORT}`);
});
