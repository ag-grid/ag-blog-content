/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_AI_API_URL?: string;
    readonly VITE_AI_API_TOKEN?: string;
    readonly VITE_ASSETS_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
