import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import routes from './routes';
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
app.use(csrfMiddleware);
connectDB();

app.use('/api', routes);

app.listen(PORT, () => {
    console.log(`API listening on ${PORT}`);
});
