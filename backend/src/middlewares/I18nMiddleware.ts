import { i18n } from "../config/i18n";
import Cookies from "cookies";
import { NextFunction, Request, Response } from "express";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";

@Middleware({ type: 'before' })
export class I18nMiddleware implements ExpressMiddlewareInterface {
    use(req: Request, res: Response, next: NextFunction) {
        const cookies = new Cookies(req, res);

        const lang = cookies.get('_lang') || 'en';

        const supoprtedLangs = ['en', 'fr'];
        const selectedLang = supoprtedLangs.includes(lang) ? lang : 'en';

        i18n.changeLanguage(selectedLang);
        (req as any).language = selectedLang;
        next();
    }
}