import io from 'socket.io-client';

// Determine socket URL: use VITE_API_URL (without /api suffix) if set, otherwise default to window.location.origin
const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
        // Remove '/api' from the end if it exists to get the root server URL
        // Example: https://my-app.onrender.com/api -> https://my-app.onrender.com
        return apiUrl.replace(/\/api$/, '');
    }
    // In development or if VITE_API_URL is not set, let Socket.io auto-detect (usually window.location)
    // However, if we are in dev mode (localhost:5173) and backend is localhost:5000, we might need a fallback if proxy isn't set up for sockets.
    // Given the previous code used hardcoded localhost:5000, we should probably default to that if standard auto-detect fails or for specific dev scenarios.
    // But usually for deployment, we want it to be relative or based on the API URL.

    return import.meta.env.DEV ? 'http://localhost:5000' : undefined;
};

const socket = io(getSocketUrl(), {
    withCredentials: true,
    transports: ['websocket', 'polling'] // Force websocket first but allow polling
});

export default socket;
