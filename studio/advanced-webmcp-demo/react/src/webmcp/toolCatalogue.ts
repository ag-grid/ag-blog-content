import type { AgAiStudioTools, AgStudioApi } from 'ag-studio';

import type { StudioToolEntry } from './toolRegistry.ts';
import { studioToolEntries } from './toolRegistry.ts';
import type { WebMcpBridgedTool } from './webmcpBridge.ts';

/** One tool as the listing reports it: what it is, and whether it is registered right now. */
export interface CatalogueListing {
    name: string;
    summary: string;
    readOnly: boolean;
    base: boolean;
    registered: boolean;
}

/**
 * What the page could offer, and what it currently does. The two are deliberately different: a
 * browser caps the tools and schemas one page may publish, so the advertised set is the base
 * tools plus whatever an agent has asked for by name, while the catalogue keeps every tool
 * describable and callable whether or not it is registered.
 */
export interface ToolCatalogue {
    /** Every tool, with its current registration state. */
    list(): CatalogueListing[];
    /** One entry by name, registered or not. */
    find(name: string): StudioToolEntry | undefined;
    /** Registers by name. Returns the names it accepted; an unknown name is reported separately. */
    register(names: readonly string[]): { accepted: string[]; unknown: string[] };
    /** Unregisters by name. A base tool is never withdrawn, and comes back as `refused`. */
    unregister(names: readonly string[]): { accepted: string[]; refused: string[]; unknown: string[] };
    /** What the bridge should have registered right now. */
    advertised(): WebMcpBridgedTool[];
    /** The meta tools, supplied once by `main` and advertised on every pass. */
    setMetaTools(tools: WebMcpBridgedTool[]): void;
    /** The handoff tool, or nothing when no LLM is configured. */
    setHandoffTool(tool?: WebMcpBridgedTool): void;
}

export function createToolCatalogue(api: AgStudioApi, studio: AgAiStudioTools): ToolCatalogue {
    // Names, not built tools: a tool is rebuilt from the registry on every pass, and a name
    // survives a widget being deleted and restored, so a choice the agent made still holds.
    const registered = new Set<string>();
    let metaTools: WebMcpBridgedTool[] = [];
    let handoffTool: WebMcpBridgedTool | undefined;

    const entries = (): StudioToolEntry[] => studioToolEntries(studio, api);
    const isOn = (entry: StudioToolEntry): boolean => entry.base || registered.has(entry.name);

    return {
        list: () =>
            entries().map(({ name, summary, readOnly, base }) => ({
                name,
                summary,
                readOnly,
                base,
                registered: base || registered.has(name),
            })),
        find: (name) => entries().find((entry) => entry.name === name),
        register(names) {
            const known = new Set(entries().map(({ name }) => name));
            const accepted: string[] = [];
            const unknown: string[] = [];
            for (const name of names) {
                if (!known.has(name)) {
                    unknown.push(name);
                    continue;
                }
                registered.add(name);
                accepted.push(name);
            }
            return { accepted, unknown };
        },
        unregister(names) {
            const byName = new Map(entries().map((entry) => [entry.name, entry]));
            const accepted: string[] = [];
            const refused: string[] = [];
            const unknown: string[] = [];
            for (const name of names) {
                const entry = byName.get(name);
                if (entry == null) {
                    unknown.push(name);
                } else if (entry.base) {
                    refused.push(name);
                } else {
                    registered.delete(name);
                    accepted.push(name);
                }
            }
            return { accepted, refused, unknown };
        },
        advertised: () => [
            ...metaTools,
            ...(handoffTool != null ? [handoffTool] : []),
            ...entries()
                .filter(isOn)
                .map((entry) => ({ tool: entry.build(), readOnly: entry.readOnly })),
        ],
        setMetaTools(tools) {
            metaTools = tools;
        },
        setHandoffTool(tool) {
            handoffTool = tool;
        },
    };
}
