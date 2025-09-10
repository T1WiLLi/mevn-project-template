import { logger } from '../config/Logger';

type CleanupCallback = () => Promise<void> | void;

const cleanupCallbacks: CleanupCallback[] = [];
let isShuttingDown = false;
let hooksInitialized = false;

export const addCleanupCallback = (callback: CleanupCallback): void => {
    cleanupCallbacks.push(callback);
};

export const initializeProcessHooks = (): void => {
    if (hooksInitialized) {
        return;
    }

    const executeCleanup = async (): Promise<void> => {
        if (isShuttingDown) return;

        isShuttingDown = true;
        logger.info('Starting application cleanup...');

        for (const callback of cleanupCallbacks) {
            try {
                await callback();
            } catch (error) {
                logger.error('Cleanup callback failed:', error);
            }
        }

        logger.info('Application cleanup completed');
    };

    const gracefulShutdown = async (signal: string): Promise<void> => {
        logger.info(`Received ${signal}. Starting graceful shutdown...`);
        try {
            await executeCleanup();
            process.exit(0);
        } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    };

    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

    process.once('uncaughtException', async (error) => {
        logger.error('Uncaught Exception:', error);
        await executeCleanup();
        process.exit(1);
    });

    process.once('unhandledRejection', async (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        await executeCleanup();
        process.exit(1);
    });

    hooksInitialized = true;
    logger.info('Process hooks initialized');
};