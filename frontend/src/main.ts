import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import en from './locales/en.json';
import fr from './locales/fr.json';
import { createI18n } from 'vue-i18n';
import { getCookie } from './utils/util';

const userLocale = getCookie('_lang') || 'en';

const i18n = createI18n({
    legacy: false,
    locale: userLocale,
    fallbackLocale: 'en',
    messages: { en, fr },
});

const app = createApp(App)

app.use(router)
app.use(i18n);

app.mount('#app')
