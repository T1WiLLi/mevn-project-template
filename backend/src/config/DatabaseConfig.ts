import mongoose from 'mongoose';
import { logger } from './Logger';

const connectDB = async () => {
    const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/mevn_startup';
    let retries = 5;

    while (retries) {
        try {
            await mongoose.connect(uri);
            logger.info('MongoDB connected');
            break;
        } catch (err) {
            retries -= 1;
            logger.warn(`MongoDB connection failed, retrying... (${retries} retries left)`);
            logger.debug(err);
            await new Promise(res => setTimeout(res, 5000));
        }
    }

    if (!retries) {
        logger.error('MongoDB connection failed after all retries');
        process.exit(1);
    }
};

export default connectDB;
