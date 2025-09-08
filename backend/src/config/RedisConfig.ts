import { createClient } from "redis";
import { logger } from "./Logger";

export const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
    password: process.env.REDIS_PASSWORD,
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
        logger.info("Redis connected");
    } catch (err) {
        logger.error("Redis connection error", err);
    }
}

export default connectRedis;
