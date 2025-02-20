export const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL ?? "http://";
export const API_HOST = import.meta.env.VITE_API_HOST ?? "localhost";
export const API_PORT = import.meta.env.VITE_API_PORT ?? "5000";

export const API_URL = `${API_PROTOCOL}${API_HOST}:${API_PORT}`;
