import type { AgStudioApi } from 'ag-studio';

import type { ToolCatalogue, ToolListing } from './toolCatalogue.ts';
import type { BridgedTool } from './webmcpBridge.ts';

export interface MetaToolDeps {
    api: AgStudioApi;
    catalogue: ToolCatalogue;
    /** Runs a reconcile pass, so newly registered tools exist before the call returns. */
    reconcile(): Promise<void>;
}

/**
 * Agents read their tool list once per turn, so a change only shows up after they read it again.
 * Every register and unregister result says so.
 */
const REFRESH_NOTICE = 'Refresh your list of available tools to pick up this change.';

function listingLine({ name, summary, readOnly, base, registered }: ToolListing): string {
    const state = base ? 'always on' : registered ? 'registered' : 'available';
    return `  ${name} [${state}${readOnly ? ', read-only' : ''}] - ${summary}`;
}

interface ChangeResult {
    accepted: string[];
    refused?: string[];
    unknown: string[];
}

function describeChange(verb: string, { accepted, refused = [], unknown }: ChangeResult): string {
    const lines = [accepted.length > 0 ? `${verb}: ${accepted.join(', ')}.` : `${verb} nothing.`];
    if (refused.length > 0) lines.push(`Always on, so kept: ${refused.join(', ')}.`);
    if (unknown.length > 0) lines.push(`Not in the library: ${unknown.join(', ')}.`);
    if (accepted.length > 0) lines.push(REFRESH_NOTICE);
    return lines.join(' ');
}

/**
 * The tools that manage the other tools. Always published, so an agent can always reach the rest
 * of the library however little of it is currently registered.
 *
 * There is deliberately no dispatcher (one tool taking a name and a bag of arguments): each Studio
 * tool is called as itself, so the browser validates arguments against its real schema and sees its
 * real `readOnlyHint`. The cost is that an agent must register a tool before calling it.
 */
export function createMetaTools({ api, catalogue, reconcile }: MetaToolDeps): BridgedTool[] {
    const viewLibrary = api.defineAiTool({
        name: 'view_tool_library',
        description:
            'Browse the library of dashboard tools: every tool with a one-line description and ' +
            'whether it is currently registered. Most are not registered, because the browser ' +
            'limits how much one page may publish. Take what you need with register_studio_tools.',
        params: (s) => s.object({ search: s.string({ description: 'Optional substring filter.' }).optional() }),
        execute: ({ search }, ctx) => {
            const term = search?.toLowerCase();
            const listings = catalogue
                .list()
                .filter((item) => term == null || `${item.name} ${item.summary}`.toLowerCase().includes(term));
            if (listings.length === 0) return ctx.success(`No dashboard tool matches ${search}.`);
            return ctx.success(
                [
                    'Dashboard tool library. Register the tools you need, refresh your tool list, then',
                    'call them directly. Unregister them when done to leave room for others.',
                    '',
                    ...listings.map(listingLine),
                ].join('\n')
            );
        },
    });

    const registerTools = api.defineAiTool({
        name: 'register_studio_tools',
        description:
            'Register named tools from the library so they can be called. Register only what you ' +
            'need: the browser limits how much a page may publish, and widget-configuration tools ' +
            'carry large schemas. Refresh your tool list afterwards to see them.',
        params: (s) => s.object({ names: s.array(s.string(), { description: 'Tool names to register.' }) }),
        execute: async ({ names }, ctx) => {
            const result = catalogue.register(names);
            await reconcile();
            return ctx.success(describeChange('Registered', result));
        },
    });

    const unregisterTools = api.defineAiTool({
        name: 'unregister_studio_tools',
        description:
            'Return named tools to the library, freeing room for others. The always-on tools ' +
            'cannot be withdrawn. Refresh your tool list afterwards.',
        params: (s) => s.object({ names: s.array(s.string(), { description: 'Tool names to withdraw.' }) }),
        execute: async ({ names }, ctx) => {
            const result = catalogue.unregister(names);
            await reconcile();
            return ctx.success(describeChange('Unregistered', result));
        },
    });

    return [
        { tool: viewLibrary, readOnly: true },
        { tool: registerTools, readOnly: false },
        { tool: unregisterTools, readOnly: false },
    ];
}
