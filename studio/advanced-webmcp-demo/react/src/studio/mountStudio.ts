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
import type { PublishedTool, ToolCallOutcome, WebMcpBridge } from '../webmcp/webmcpBridge.ts';
import { createWebMcpBridge } from '../webmcp/webmcpBridge.ts';

if (import.meta.env.DEV) {
    enableStudioDevValidations();
}

AgStudioModuleRegistry.registerModules([AgStudioAiModule]);

// See the README for setting these. Without a URL the analyst handoff is switched off.
const AI_API_URL = import.meta.env.AI_API_URL;
const AI_API_TOKEN = import.meta.env.AI_API_TOKEN || undefined;
// Defaults to the folder the page is served from, so the build works under any sub-path.
const ASSETS_BASE_URL = (
    import.meta.env.VITE_ASSETS_BASE_URL || new URL(import.meta.env.BASE_URL, document.baseURI).href
).replace(/\/$/, '');

const MAX_LOG_ENTRIES = 20;
const MAX_LOG_TEXT = 100;

export interface LogEntry {
    id: number;
    text: string;
    /** Set for tool calls; plain notes have none. */
    status?: 'running' | 'ok' | 'error';
    /** The call's result summary, once it has finished. */
    detail?: string;
}

function truncate(text: string, max = MAX_LOG_TEXT): string {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function describeCall(name: string, args: Record<string, unknown>): string {
    return truncate(`${name}(${Object.keys(args).length > 0 ? JSON.stringify(args) : ''})`);
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

    function addLog(entry: Omit<LogEntry, 'id'>): number {
        const id = nextLogId++;
        log = [...log, { id, ...entry }].slice(-MAX_LOG_ENTRIES);
        emit();
        return id;
    }

    function updateLog(id: number, changes: Partial<LogEntry>): void {
        log = log.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry));
        emit();
    }

    const addNote = (text: string): void => void addLog({ text });

    /** Logs a tool call as it starts, and fills in its outcome when it finishes. */
    function logCall(name: string, args: Record<string, unknown>): (outcome: ToolCallOutcome) => void {
        const id = addLog({ text: describeCall(name, args), status: 'running' });
        return ({ ok, summary }) =>
            updateLog(id, { status: ok ? 'ok' : 'error', detail: truncate(summary.split('\n')[0]) });
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
        toolCatalogue.pin(createMetaTools({ api, catalogue: toolCatalogue, reconcile }));

        if (AI_API_URL !== '') {
            try {
                // Built directly rather than through the `ai` property, which would also add
                // Studio's chat panel; here the browser agent is the only conversation.
                const harness = createAiHarness(api, {
                    adapter: openaiAdapter({ endpoint: AI_API_URL, key: AI_API_TOKEN }),
                });
                toolCatalogue.pin([createHandoffTool({ api, harness, log: addNote })]);
            } catch (err) {
                error = `Could not create the analyst: ${errorMessage(err)}`;
            }
        }

        catalogue = toolCatalogue;
        bridge = createWebMcpBridge(() => toolCatalogue.published(), { onCall: logCall });
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

    // Not every WebMCP browser fires `toolchange`; the log entry is informational only.
    const onToolChange = (): void => addNote('browser reported toolchange');
    document.modelContext?.addEventListener?.('toolchange', onToolChange);

    const studioApi = createStudio(container, properties);

    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getSnapshot: () => snapshot,
        destroy() {
            document.modelContext?.removeEventListener?.('toolchange', onToolChange);
            listeners.clear();
            studioApi.destroy();
        },
    };
}
