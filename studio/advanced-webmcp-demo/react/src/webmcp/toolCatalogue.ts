import type { AgAiStudioTools, AgStudioApi } from 'ag-studio';

import type { ToolEntry } from './toolRegistry.ts';
import { getToolEntries } from './toolRegistry.ts';
import type { BridgedTool } from './webmcpBridge.ts';

/** A library tool and whether it is currently registered. */
export interface ToolListing {
    name: string;
    summary: string;
    readOnly: boolean;
    base: boolean;
    registered: boolean;
}

/**
 * The library of Studio tools versus the ones published right now: the base tools plus whatever
 * the agent has registered by name. Keeping the two apart is what keeps the page inside the
 * browser's budget.
 */
export interface ToolCatalogue {
    list(): ToolListing[];
    register(names: readonly string[]): { accepted: string[]; unknown: string[] };
    /** Base tools are never withdrawn; they come back as `refused`. */
    unregister(names: readonly string[]): { accepted: string[]; refused: string[]; unknown: string[] };
    /** Adds tools that sit outside the library and are always published, such as the meta tools. */
    pin(tools: readonly BridgedTool[]): void;
    /** Everything that should be published right now. */
    published(): BridgedTool[];
}

export function createToolCatalogue(api: AgStudioApi, studio: AgAiStudioTools): ToolCatalogue {
    // Registrations are held by name rather than as built tools, so a choice survives a widget
    // being deleted and restored.
    const registered = new Set<string>();
    const pinned: BridgedTool[] = [];

    const entries = (): ToolEntry[] => getToolEntries(studio, api);
    const isRegistered = (entry: ToolEntry): boolean => entry.base || registered.has(entry.name);

    return {
        list: () =>
            entries().map((entry) => ({
                name: entry.name,
                summary: entry.summary,
                readOnly: entry.readOnly,
                base: entry.base,
                registered: isRegistered(entry),
            })),

        register(names) {
            const known = new Set(entries().map(({ name }) => name));
            const accepted = names.filter((name) => known.has(name));
            const unknown = names.filter((name) => !known.has(name));
            accepted.forEach((name) => registered.add(name));
            return { accepted, unknown };
        },

        unregister(names) {
            const byName = new Map(entries().map((entry) => [entry.name, entry]));
            const result = { accepted: [] as string[], refused: [] as string[], unknown: [] as string[] };
            for (const name of names) {
                const entry = byName.get(name);
                if (entry == null) {
                    result.unknown.push(name);
                } else if (entry.base) {
                    result.refused.push(name);
                } else {
                    registered.delete(name);
                    result.accepted.push(name);
                }
            }
            return result;
        },

        pin(tools) {
            pinned.push(...tools);
        },

        published: () => [
            ...pinned,
            ...entries()
                .filter(isRegistered)
                .map((entry) => ({ tool: entry.build(), readOnly: entry.readOnly })),
        ],
    };
}
