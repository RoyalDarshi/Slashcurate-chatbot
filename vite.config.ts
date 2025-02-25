import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: ["lucide-react"],
    },
    define: {
        "process.env": process.env,
    },
    server: {
        host: '0.0.0.0',
        port: 5173, // Or your desired port
    },
});