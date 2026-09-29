import type { AgStudioApi, AgStudioProperties } from 'ag-studio';
import {
    AgStudioAiModule,
    AgStudioModuleRegistry,
    createAiHarness,
    createStudio,
    enableStudioDevValidations,
} from 'ag-studio';

import { openaiAdapter } from '../ai/openaiAdapter.ts';
import { getWeatherData } from '../data/weatherData.ts';
import { weatherReport } from '../data/weatherReport.ts';
import { errorMessage } from '../utils/errorMessage.ts';
import { createHandoffTool } from '../webmcp/handoffTool.ts';
import { createMetaTools } from '../webmcp/metaTools.ts';
import type { ToolCatalogue, ToolListing } from '../webmcp/toolCatalogue.ts';
import { createToolCatalogue } from '../webmcp/toolCatalogue.ts';
import type { PublishedTool, WebMcpBridge } from '../webmcp/webmcpBridge.ts';
import { createWebMcpBridge } from '../webmcp/webmcpBridge.ts';

if (import.meta.env.DEV) {
    enableStudioDevValidations();
}

AgStudioModuleRegistry.registerModules([AgStudioAiModule]);

// The AG AI proxy accepts the blog's origin without a key; on localhost, vite.config.ts supplies a
// dev key. An empty URL switches the analyst handoff off.
const AI_API_URL = import.meta.env.VITE_AI_API_URL ?? 'https://ai-api.ag-grid.com/api/openai/v1';
const AI_API_TOKEN = import.meta.env.VITE_AI_API_TOKEN || undefined;
const ASSETS_BASE_URL = import.meta.env.VITE_ASSETS_BASE_URL ?? '';

const MAX_LOG_ENTRIES = 20;

export interface LogEntry {
    id: number;
    text: string;
}

/** What the demo panel shows about the WebMCP bridge. */
export interface WebMcpSnapshot {
    supported: boolean;
    handoffEnabled: boolean;
    published: PublishedTool[];
    library: ToolListing[];
    log: LogEntry[];
    error: string;
}

export interface MountedStudio {
    subscribe(listener: (snapshot: WebMcpSnapshot) => void): () => void;
    getSnapshot(): WebMcpSnapshot;
    destroy(): void;
}

/**
 * Creates Studio in `container` and publishes its AI tools to the browser through WebMCP. Framework
 * agnostic: the React component only mounts it and renders the snapshots it emits.
 */
export function mountStudio(container: HTMLElement): MountedStudio {
    let catalogue: ToolCatalogue | undefined;
    let bridge: WebMcpBridge | undefined;
    let error = '';
    let log: LogEntry[] = [];
    let nextLogId = 0;
    const listeners = new Set<(snapshot: WebMcpSnapshot) => void>();

    const takeSnapshot = (): WebMcpSnapshot => ({
        supported: document.modelContext != null,
        handoffEnabled: AI_API_URL !== '',
        published: bridge?.getPublishedTools() ?? [],
        library: catalogue?.list() ?? [],
        log,
        error,
    });
    let snapshot = takeSnapshot();

    function emit(): void {
        snapshot = takeSnapshot();
        listeners.forEach((listener) => listener(snapshot));
    }

    function addLog(text: string): void {
        log = [...log, { id: nextLogId++, text }].slice(-MAX_LOG_ENTRIES);
        emit();
    }

    async function reconcile(): Promise<void> {
        // State events can fire before `studioReady`, when there is nothing to reconcile yet.
        if (bridge == null) return;
        try {
            await bridge.reconcile();
            error = bridge.lastError() ?? '';
        } catch (err) {
            error = `Reconcile failed: ${errorMessage(err)}`;
        }
        emit();
    }

    function onStudioReady(api: AgStudioApi): void {
        const toolCatalogue = createToolCatalogue(api, api.getAiTools());
        toolCatalogue.pin(createMetaTools({ api, catalogue: toolCatalogue, reconcile, log: addLog }));

        if (AI_API_URL !== '') {
            try {
                // Built directly rather than through the `ai` property, which would also add
                // Studio's chat panel; here the browser agent is the only conversation.
                const harness = createAiHarness(api, {
                    adapter: openaiAdapter({ endpoint: AI_API_URL, key: AI_API_TOKEN }),
                });
                toolCatalogue.pin([createHandoffTool({ api, harness, log: addLog })]);
            } catch (err) {
                error = `Could not create the analyst: ${errorMessage(err)}`;
            }
        }

        catalogue = toolCatalogue;
        bridge = createWebMcpBridge(() => toolCatalogue.published());
        void reconcile();
    }

    const properties: AgStudioProperties = {
        mode: 'edit',
        initialState: weatherReport,
        data: getWeatherData(ASSETS_BASE_URL),
        onStudioReady: ({ api }) => onStudioReady(api),
        // Either can change which tools exist or what their schemas accept.
        onStateUpdated: () => void reconcile(),
        onRenderStateChanged: () => void reconcile(),
        onStudioPreDestroyed: () => bridge?.destroy(),
    };

    const onToolChange = (): void => addLog('browser reported toolchange');
    document.modelContext?.addEventListener('toolchange', onToolChange);

    const studioApi = createStudio(container, properties);

    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getSnapshot: () => snapshot,
        destroy() {
            document.modelContext?.removeEventListener('toolchange', onToolChange);
            listeners.clear();
            studioApi.destroy();
        },
    };
}
