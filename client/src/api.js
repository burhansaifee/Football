import axios from 'axios';

// Use environment variable for API URL in production, or relative path with proxy in dev
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(config => {
    // Check if the request explicitly provided an Authorization header (like during Login/Register)
    if (!config.headers.Authorization) {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
