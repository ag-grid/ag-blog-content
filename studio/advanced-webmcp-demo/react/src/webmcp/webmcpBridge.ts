import type { AgAiTool } from 'ag-studio';
import { createAiToolContext } from 'ag-studio';

import { errorMessage } from '../utils/errorMessage.ts';
import type { WebMcpToolResult } from './webmcpTypes.ts';

/**
 * A Studio tool to publish, and whether it only reads the dashboard. Browser agents may skip
 * asking the user before calling a tool marked `readOnlyHint`, so this is stated per tool.
 */
export interface BridgedTool {
    tool: AgAiTool;
    readOnly: boolean;
}

export interface PublishedTool {
    name: string;
    /** How many times the tool has been registered; it goes up each time its schema changes. */
    registrations: number;
}

export interface WebMcpBridge {
    /** Brings the browser's registrations in line with the current tools. Passes run one at a time. */
    reconcile(): Promise<void>;
    getPublishedTools(): PublishedTool[];
    isSupported(): boolean;
    lastError(): string | undefined;
    destroy(): void;
}

interface Registration {
    /** The serialised parameter schema, used to spot when a tool needs registering again. */
    signature: string;
    controller: AbortController;
    count: number;
}

const textResult = (...parts: string[]): WebMcpToolResult => ({
    content: parts.map((text) => ({ type: 'text', text })),
});

/**
 * Publishes Studio AI tools to the browser through WebMCP. `getTools` is read on every pass, so
 * the published set can grow and shrink as the dashboard changes.
 *
 * Without WebMCP support the bridge still keeps its bookkeeping, so the demo panel shows what
 * would have been published.
 */
export function createWebMcpBridge(getTools: () => readonly BridgedTool[]): WebMcpBridge {
    const modelContext = document.modelContext;
    const registrations = new Map<string, Registration>();
    let queue = Promise.resolve();
    let error: string | undefined;
    let destroyed = false;
    let callCount = 0;

    async function execute(tool: AgAiTool, args: Record<string, unknown>): Promise<WebMcpToolResult> {
        if (tool.execute == null) {
            return textResult(`${tool.name} cannot be run in the browser.`);
        }
        const id = ++callCount;
        try {
            const result = await tool.execute(
                { toolCallId: `webmcp-${id}`, name: tool.name, args },
                createAiToolContext({ run: { threadId: 'webmcp', runId: `webmcp-run-${id}` } })
            );
            if (!result.success) {
                return textResult(result.issues.map((issue) => issue.message).join('; '));
            }
            // `response` is a one-line summary; `data` carries the substance (a widget's config, a
            // query's rows). The agent needs both.
            return result.data === undefined
                ? textResult(result.response)
                : textResult(result.response, JSON.stringify(result.data, null, 2));
        } catch (err) {
            return textResult(`${tool.name} failed: ${errorMessage(err)}`);
        }
    }

    function withdraw(name: string): void {
        registrations.get(name)?.controller.abort();
        registrations.delete(name);
    }

    async function reconcileOnce(): Promise<void> {
        error = undefined;
        const tools = getTools();

        const wanted = new Set(tools.map(({ tool }) => tool.name));
        for (const name of registrations.keys()) {
            if (!wanted.has(name)) withdraw(name);
        }

        for (const { tool, readOnly } of tools) {
            // A pass can resume from `registerTool` after `destroy()`; anything registered then
            // would outlive the Studio instance behind it.
            if (destroyed) return;

            // No schema means the tool has nothing to act on in the current state.
            const schema = tool.schema();
            if (schema == null) {
                withdraw(tool.name);
                continue;
            }

            // Re-register only when the schema changed, e.g. a calculated field was added and
            // `execute_query` now accepts it.
            const signature = JSON.stringify(schema.parameters);
            const existing = registrations.get(tool.name);
            if (existing?.signature === signature) continue;

            existing?.controller.abort();
            const controller = new AbortController();
            registrations.set(tool.name, { signature, controller, count: (existing?.count ?? 0) + 1 });

            if (modelContext == null) continue;
            try {
                await modelContext.registerTool(
                    {
                        name: tool.name,
                        description: tool.description,
                        inputSchema: schema.parameters,
                        annotations: { readOnlyHint: readOnly },
                        execute: (args) => execute(tool, args),
                    },
                    { signal: controller.signal }
                );
            } catch (err) {
                // Forget the registration so the next pass retries it instead of seeing a
                // matching signature and skipping a tool the browser never accepted.
                registrations.delete(tool.name);
                error = `Failed to register ${tool.name}: ${errorMessage(err)}`;
            }
        }
    }

    return {
        reconcile() {
            const pass = queue.then(reconcileOnce);
            // Keep the queue alive after a failed pass; the caller still sees this pass's error.
            queue = pass.catch(() => undefined);
            return pass;
        },
        getPublishedTools: () => Array.from(registrations, ([name, { count }]) => ({ name, registrations: count })),
        isSupported: () => modelContext != null,
        lastError: () => error,
        destroy() {
            destroyed = true;
            for (const { controller } of registrations.values()) controller.abort();
            registrations.clear();
        },
    };
}
