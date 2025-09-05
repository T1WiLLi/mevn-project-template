import { getCookie } from "@/utils/util";
import axios from "axios";

const api = axios.create({ baseURL: '/api' });
api.defaults.withCredentials = true;
api.interceptors.request.use(config => {
    const method = (config.method || 'GET').toUpperCase();

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const token = getCookie('_csrf');
        if (token) {
            config.headers['x-csrf-token'] = token;
        }
    }
    return config;
});

export default api;