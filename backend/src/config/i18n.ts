import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

i18next
    .use(Backend)
    .init({
        lng: 'en',
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr'],

        backend: {
            loadPath: path.resolve(__dirname, '../locales/{{lng}}.json'),
        },

        interpolation: {
            escapeValue: false,
        },

        debug: process.env.NODE_ENV === 'development',

        initImmediate: false,
    });

export { i18next as i18n };
export const t = i18next.t.bind(i18next);