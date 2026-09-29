import type { AgAiHarness, AgStudioApi, AgStudioProperties } from 'ag-studio';
import {
    AgStudioAiModule,
    AgStudioModuleRegistry,
    createAiHarness,
    createStudio,
    enableStudioDevValidations,
} from 'ag-studio';

import { getGhcnCitiesData } from './ghcnCities/data.ts';
import { ghcnCitiesReportState } from './ghcnCities/state.ts';
import { openaiAdapter } from './openaiAdapter.ts';
import { createHandoffTool } from './webmcp/handoffTool.ts';
import { createMetaTools } from './webmcp/metaTools.ts';
import type { CatalogueListing, ToolCatalogue } from './webmcp/toolCatalogue.ts';
import { createToolCatalogue } from './webmcp/toolCatalogue.ts';
import type { AdvertisedTool, StudioWebMcpBridge } from './webmcp/webmcpBridge.ts';
import { createWebMcpBridge } from './webmcp/webmcpBridge.ts';

if (import.meta.env.DEV) {
    // Enable extended validations only for development
    enableStudioDevValidations();
}

AgStudioModuleRegistry.registerModules([AgStudioAiModule]);

// The AG AI proxy admits the blog's origin without a key, so a deployed build sends none. On
// localhost it needs a dev key, supplied through the environment. An empty URL is what switches
// the handoff off - so the page's own tools are the default and the delegating tool is the addition.
const AI_API_URL = import.meta.env.VITE_AI_API_URL ?? 'https://ai-api.ag-grid.com/api/openai/v1';
const AI_API_TOKEN = import.meta.env.VITE_AI_API_TOKEN || undefined;
const ASSETS_BASE_URL = import.meta.env.VITE_ASSETS_BASE_URL ?? '';
const HANDOFF_CONFIGURED = AI_API_URL !== '';

/** What the page reports about its WebMCP bridge, for the panel beside the dashboard. */
export interface WebMcpSnapshot {
    supported: boolean;
    handoffConfigured: boolean;
    advertised: AdvertisedTool[];
    catalogue: CatalogueListing[];
    callLog: string[];
    lastError: string;
}

export interface StudioWebMcp {
    subscribe(listener: (snapshot: WebMcpSnapshot) => void): () => void;
    getSnapshot(): WebMcpSnapshot;
    destroy(): void;
}

/**
 * Mounts Studio into `container` and bridges its AI tools to the browser's WebMCP API. Nothing here
 * is React-specific; the component only mounts it and renders the snapshots it publishes.
 */
export function mountStudioWebMcp(container: HTMLElement): StudioWebMcp {
    let studioApi: AgStudioApi;
    let catalogue: ToolCatalogue | undefined;
    let bridge: StudioWebMcpBridge | undefined;
    let harness: AgAiHarness | undefined;
    let handoffAttached = false;
    let lastError = '';
    const callLog: string[] = [];
    const listeners = new Set<(snapshot: WebMcpSnapshot) => void>();

    const takeSnapshot = (): WebMcpSnapshot => ({
        supported: bridge?.isSupported() ?? document.modelContext != null,
        handoffConfigured: HANDOFF_CONFIGURED,
        advertised: bridge?.getAdvertisedTools() ?? [],
        catalogue: catalogue?.list() ?? [],
        callLog: [...callLog],
        lastError,
    });
    let snapshot = takeSnapshot();

    function publish(): void {
        snapshot = takeSnapshot();
        for (const listener of listeners) listener(snapshot);
    }

    function log(line: string): void {
        callLog.push(line);
        // A demonstration surface, not a record: only the recent calls are worth keeping.
        if (callLog.length > 20) callLog.shift();
        publish();
    }

    /**
     * The AI Assistant panel is deliberately absent. Studio publishes that panel whenever the `ai`
     * property is set, and nothing on this page opens a conversation - the handoff tool talks to
     * the data agent directly. So the harness is built here rather than declared as a property.
     */
    function attachHandoffTool(): void {
        if (!HANDOFF_CONFIGURED || handoffAttached || catalogue == null) return;
        try {
            harness ??= createAiHarness(studioApi, {
                adapter: openaiAdapter({ endpoint: AI_API_URL, key: AI_API_TOKEN }),
            });
            catalogue.setHandoffTool(createHandoffTool({ api: studioApi, harness, log }));
            // Only once it worked: a failed attempt must be retried on the next pass rather than
            // leaving the page permanently, and silently, without its handoff tool.
            handoffAttached = true;
        } catch (err) {
            lastError = `Could not build the analyst harness: ${err instanceof Error ? err.message : String(err)}`;
        }
    }

    async function reconcileNow(): Promise<void> {
        // `stateUpdated` and `renderStateChanged` can both fire before `studioReady`, so a pass can
        // be asked for before there is anything to reconcile. The bridge is built last, which makes
        // it the one thing worth testing for.
        if (bridge == null) return;
        try {
            attachHandoffTool();
            await bridge.reconcile();
            // Cleared on every pass that gets this far, so a fault that has since been retried out
            // of existence does not sit in the panel looking current.
            lastError = bridge.lastError() ?? '';
        } catch (err) {
            lastError = `Reconcile failed: ${err instanceof Error ? err.message : String(err)}`;
        }
        publish();
    }

    const studioProperties: AgStudioProperties = {
        mode: 'edit',
        initialState: ghcnCitiesReportState,
        data: getGhcnCitiesData(ASSETS_BASE_URL),
        onStudioReady: (event) => {
            studioApi = event.api;
            const studioTools = studioApi.getAiTools();
            const toolCatalogue = createToolCatalogue(studioApi, studioTools);
            toolCatalogue.setMetaTools(
                createMetaTools({ api: studioApi, catalogue: toolCatalogue, reconcile: reconcileNow, log })
            );
            catalogue = toolCatalogue;
            bridge = createWebMcpBridge(() => toolCatalogue.advertised());
            void reconcileNow();
        },
        onStateUpdated: () => {
            void reconcileNow();
        },
        onRenderStateChanged: () => {
            void reconcileNow();
        },
        onStudioPreDestroyed: () => {
            bridge?.destroy();
        },
    };

    const onToolChange = (): void => log('browser reported toolchange');
    document.modelContext?.addEventListener('toolchange', onToolChange);

    const api = createStudio(container, studioProperties);

    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getSnapshot: () => snapshot,
        destroy() {
            document.modelContext?.removeEventListener('toolchange', onToolChange);
            listeners.clear();
            api.destroy();
        },
    };
}
