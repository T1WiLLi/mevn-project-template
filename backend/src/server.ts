import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: allowed.length ? allowed : true,
    credentials: true,
}));

app.use(express.json());
connectDB();

app.use('/api', routes);

app.listen(PORT, () => {
    console.log(`API listening on ${PORT}`);
});
