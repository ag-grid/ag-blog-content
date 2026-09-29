import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
    plugins: [react()],
    // The AG AI proxy rejects localhost unless it gets a key, so the dev server passes one through
    // from AG_AI_API_DEV_TOKEN. A production build never gets it: the deployed page relies on the
    // blog's origin being allowed instead, and nothing secret lands in the bundle.
    define:
        command === 'serve'
            ? { 'import.meta.env.VITE_AI_API_TOKEN': JSON.stringify(process.env.AG_AI_API_DEV_TOKEN ?? '') }
            : {},
}));
