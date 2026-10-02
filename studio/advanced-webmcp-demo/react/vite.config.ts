import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
    // Reads .env files and the shell environment. The empty prefix allows names without `VITE_`.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        define: {
            'import.meta.env.AI_API_URL': JSON.stringify(env.AI_API_URL ?? ''),
            // Only the dev server gets the token. Anything in a production build can be read by every
            // visitor, so a deployed page must use an endpoint that needs no key in the browser.
            'import.meta.env.AI_API_TOKEN': JSON.stringify(command === 'serve' ? (env.AI_API_TOKEN ?? '') : ''),
        },
    };
});
