import { getCookie } from "@/utils/util";
import axios from "axios";

axios.interceptors.request.use(config => {
    const method = (config.method || 'GET').toUpperCase();

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const token = getCookie('_csrf');
        if (token) {
            config.headers['x-csrf-token'] = token;
        }
    }
    return config;
});