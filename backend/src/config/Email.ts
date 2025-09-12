import nodemailer, { Transporter } from 'nodemailer';
import { logger } from './Logger';

type EmailConfig = {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    requireTLS: boolean;
    ignoreTLS: boolean;
}

// This class uses 'any' keyword almost everywhere, this is for simplicity, but it's not a good practice.
export default class Email {

    private static instance: Email;
    private transporter: Transporter | null;
    private isConfigured: boolean;

    constructor() {
        if (Email.instance) {
            return Email.instance;
        }

        this.transporter = null;
        this.isConfigured = false;
        this._configure();

        Email.instance = this;
        return this;
    }

    _configure() {
        const config = {
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT as string) || 587,
            secure: process.env.MAIL_ENCRYPTION === 'ssl',
        } as EmailConfig;

        if (process.env.MAIL_USERNAME) {
            config.auth = {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD ?? '',
            };
        }

        if (process.env.MAIL_ENCRYPTION === 'tls') {
            config.secure = false;
            config.requireTLS = true;
        }

        if (process.env.NODE_ENV === 'development' && process.env.MAIL_HOST === 'mailcatch') {
            config.secure = false;
            config.requireTLS = false;
            config.ignoreTLS = true;
        }

        try {
            this.transporter = nodemailer.createTransport(config);
            this.isConfigured = true;

            this.transporter.verify((error: Error | null, _success: boolean) => {
                if (error) {
                    logger.warn('Email service configuration error:', error.message);
                    this.isConfigured = false;
                } else {
                    logger.info('Email service is ready to send messages');
                    if (process.env.NODE_ENV === 'development' && process.env.MAIL_HOST === 'mailcatch') {
                        logger.info('📧 MailCatch web interface: http://localhost:1080');
                    }
                }
            });
        } catch (error: any) {
            logger.warn('Failed to create email transporter:', error.message);
            this.isConfigured = false;
        }
    }

    getTransporter() {
        if (!this.isConfigured || !this.transporter) {
            throw new Error('Email service is not properly configured');
        }
        return this.transporter;
    }

    isReady() {
        return this.isConfigured && this.transporter !== null;
    }

    getFromAddress() {
        return {
            name: process.env.MAIL_FROM_NAME || 'Your App',
            address: process.env.MAIL_FROM_ADDRESS || 'noreply@yourapp.com',
        };
    }

    reconfigure() {
        logger.debug('🔄 Reconfiguring email service...');
        this._configure();
    }

    getConfig() {
        return {
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            encryption: process.env.MAIL_ENCRYPTION,
            hasAuth: !!process.env.MAIL_USERNAME,
            fromAddress: this.getFromAddress(),
            isReady: this.isReady(),
            environment: process.env.NODE_ENV,
        };
    }

    static getInstance() {
        if (!Email.instance) {
            Email.instance = new Email();
        }
        return Email.instance;
    }
}