import type { AgAiTool } from 'ag-studio';
import { createAiToolContext } from 'ag-studio';

import type { WebMcpModelContext, WebMcpToolResult } from './webmcpTypes.ts';

export interface AdvertisedTool {
    name: string;
    registrations: number;
}

/**
 * One tool to bridge, plus whether it only reads the dashboard. A browser agent may relax its
 * confirmation policy on a tool annotated `readOnlyHint`, so the caller states this per tool
 * rather than the bridge assuming it.
 */
export interface WebMcpBridgedTool {
    tool: AgAiTool;
    readOnly: boolean;
}

/**
 * Supplies the tools that should be advertised right now. Called once per reconcile pass, so the
 * set can grow and shrink between passes - which is what lets a group be loaded on request, and
 * what lets a per-widget tool exist only while its widget does.
 */
export type WebMcpToolProvider = () => readonly WebMcpBridgedTool[];

export interface StudioWebMcpBridge {
    reconcile(): Promise<void>;
    getAdvertisedTools(): AdvertisedTool[];
    isSupported(): boolean;
    lastError(): string | undefined;
    destroy(): void;
}

interface RegistryEntry {
    signature: string;
    controller: AbortController;
    registrations: number;
}

let callCounter = 0;

export function createWebMcpBridge(provider: WebMcpToolProvider): StudioWebMcpBridge {
    const registry = new Map<string, RegistryEntry>();
    const modelContext: WebMcpModelContext | undefined = document.modelContext;
    let queue: Promise<void> = Promise.resolve();
    let error: string | undefined;
    let destroyed = false;

    // The browser renders the `content` array of the returned result; a bare string leaves it with
    // nothing to show, so every branch below wraps its text in one `text` part.
    const asResult = (text: string): WebMcpToolResult => ({ content: [{ type: 'text', text }] });

    /**
     * A Studio tool answers with a one-line `response` and, for most tools, a structured `data`
     * payload - a widget's configuration, a query's rows. Both are meant for the model: returning
     * only `response` is why `view_widget` reads back as "Widget x: line-chart (12x26)" and
     * nothing else. Both go into the content array, the summary first.
     */
    const asToolResult = (response: string, data?: unknown): WebMcpToolResult => {
        if (data === undefined) return asResult(response);
        return {
            content: [
                { type: 'text', text: response },
                { type: 'text', text: JSON.stringify(data, null, 2) },
            ],
        };
    };

    async function runTool(tool: AgAiTool, args: Record<string, unknown>): Promise<WebMcpToolResult> {
        if (tool.execute == null) {
            return asResult(`${tool.name} is not client-executable`);
        }
        const controller = new AbortController();
        const id = ++callCounter;
        try {
            const result = await tool.execute(
                { toolCallId: `webmcp-${id}`, name: tool.name, args },
                createAiToolContext({
                    signal: controller.signal,
                    run: { threadId: 'webmcp', runId: `webmcp-run-${id}` },
                })
            );
            return result.success
                ? asToolResult(result.response, result.data)
                : asResult(result.issues.map((issue) => issue.message).join('; '));
        } catch (err) {
            return asResult(`${tool.name} failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    /** Returns false when the browser rejected the registration, so the caller can drop the entry. */
    async function register(
        { tool, readOnly }: WebMcpBridgedTool,
        parameters: unknown,
        controller: AbortController
    ): Promise<boolean> {
        if (modelContext == null || destroyed) return true;
        try {
            await modelContext.registerTool(
                {
                    name: tool.name,
                    description: tool.description,
                    inputSchema: parameters,
                    annotations: { readOnlyHint: readOnly },
                    execute: (args) => runTool(tool, args),
                },
                { signal: controller.signal }
            );
            return true;
        } catch (err) {
            error = `Failed to register ${tool.name}: ${err instanceof Error ? err.message : String(err)}`;
            return false;
        }
    }

    function drop(name: string, entry: RegistryEntry): void {
        registry.delete(name);
        if (modelContext != null) entry.controller.abort();
    }

    async function reconcileOnce(): Promise<void> {
        error = undefined;
        const bridged = provider();

        // A tool can now leave the advertised set two ways: by going uncallable, as before, and by
        // dropping out of the provider's list entirely (a group unloaded, a widget deleted). The
        // second leaves no entry to test a schema against, so the sweep is what withdraws it.
        const wanted = new Set(bridged.map(({ tool }) => tool.name));
        for (const [name, entry] of registry) {
            if (!wanted.has(name)) drop(name, entry);
        }

        for (const entryToBridge of bridged) {
            // A pass suspended on `registerTool` can resume after `destroy()`, and must not register
            // anything then: those registrations would outlive the Studio instance behind them.
            if (destroyed) return;

            const { tool } = entryToBridge;
            const schema = tool.schema();
            const entry = registry.get(tool.name);

            if (schema == null) {
                if (entry != null) drop(tool.name, entry);
                continue;
            }

            const signature = JSON.stringify(schema.parameters);
            if (entry?.signature === signature) continue;

            const controller = new AbortController();
            registry.set(tool.name, {
                signature,
                controller,
                registrations: (entry?.registrations ?? 0) + 1,
            });
            if (entry != null && modelContext != null) entry.controller.abort();

            // A failed registration must not leave its signature behind: a matching signature makes
            // every later pass skip a tool the browser does not have.
            if (!(await register(entryToBridge, schema.parameters, controller))) registry.delete(tool.name);
        }
    }

    return {
        reconcile() {
            const pass = queue.then(reconcileOnce);
            // The chain's tail must never stay rejected, or one failed pass silently disables every
            // later `reconcile()`. The caller still sees this pass's rejection.
            queue = pass.catch(() => undefined);
            return pass;
        },
        getAdvertisedTools() {
            return Array.from(registry, ([name, entry]) => ({ name, registrations: entry.registrations }));
        },
        isSupported() {
            return modelContext != null;
        },
        lastError() {
            return error;
        },
        destroy() {
            destroyed = true;
            if (modelContext != null) {
                for (const entry of registry.values()) entry.controller.abort();
            }
            registry.clear();
        },
    };
}
