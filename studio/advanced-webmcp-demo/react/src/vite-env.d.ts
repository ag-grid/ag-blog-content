/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Set by vite.config.ts. */
    readonly AI_API_URL: string;
    /** Set by vite.config.ts; always empty in production builds. */
    readonly AI_API_TOKEN: string;
    readonly VITE_ASSETS_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
