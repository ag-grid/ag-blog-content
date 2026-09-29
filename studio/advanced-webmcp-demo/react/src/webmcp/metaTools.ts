import type { AgStudioApi } from 'ag-studio';

import type { CatalogueListing, ToolCatalogue } from './toolCatalogue.ts';
import type { WebMcpBridgedTool } from './webmcpBridge.ts';

export interface MetaToolDeps {
    api: AgStudioApi;
    catalogue: ToolCatalogue;
    /** Re-runs a reconcile pass, so a tool registered by a call exists before the call returns. */
    reconcile(): Promise<void>;
    /** Records a line in the page's call log, so the sequence is readable without an agent attached. */
    log(line: string): void;
}

/**
 * Said at the end of every register and unregister result. The page has already reconciled by the
 * time the agent reads this, so the tools are there - but an agent working from the tool list it
 * read at the start of the turn will not see them until it reads the list again.
 */
const REFRESH_NOTICE = 'Refresh your list of available tools to pick up this change.';

function listingLine({ name, summary, readOnly, base, registered }: CatalogueListing): string {
    const state = base ? 'always on' : registered ? 'registered' : 'available';
    return `  ${name} [${state}${readOnly ? ', read-only' : ''}] - ${summary}`;
}

/**
 * The tools that manage the other tools. They are registered from the start and never withdrawn,
 * so an agent always has a way in however little of the Studio surface is currently published.
 *
 * The shape of this set follows from a browser-side budget: Chrome disables WebMCP for the entire
 * page when the tools and schemas it publishes exceed what the browser supports, and Studio's
 * widget-configuration schemas are large enough to reach that on their own. So the page publishes
 * two Studio tools by default and lets an agent take the rest from the library one at a time.
 *
 * There is deliberately no dispatcher - no one tool taking a target name and a blob of arguments.
 * Every Studio tool is called as itself, so the browser validates its arguments against the real
 * schema and carries its own `readOnlyHint`. The cost is that calling a tool means registering it
 * and refreshing first.
 */
export function createMetaTools({ api, catalogue, reconcile, log }: MetaToolDeps): WebMcpBridgedTool[] {
    const viewLibrary = api.defineAiTool({
        name: 'view_tool_library',
        description:
            'Browse the library of dashboard tools: every tool with a one-line description and ' +
            'whether it is currently registered. Most are not registered, because the browser ' +
            'limits how much one page may publish. Take what you need with register_studio_tools.',
        params: (s) => s.object({ search: s.string({ description: 'Optional substring filter.' }).optional() }),
        execute: ({ search }, ctx) => {
            log(`view_tool_library(${search ?? 'all'})`);
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
            log(`register_studio_tools(${names.join(', ')})`);
            const { accepted, unknown } = catalogue.register(names);
            // Reconcile before returning, so the browser has the registrations by the time the
            // agent reads this result rather than one event loop later.
            await reconcile();
            const lines = [accepted.length > 0 ? `Registered: ${accepted.join(', ')}.` : 'Registered nothing.'];
            if (unknown.length > 0) lines.push(`Not in the library: ${unknown.join(', ')}.`);
            if (accepted.length > 0) lines.push(REFRESH_NOTICE);
            return ctx.success(lines.join(' '));
        },
    });

    const unregisterTools = api.defineAiTool({
        name: 'unregister_studio_tools',
        description:
            'Return named tools to the library, freeing room for others. The always-on tools ' +
            'cannot be withdrawn. Refresh your tool list afterwards.',
        params: (s) => s.object({ names: s.array(s.string(), { description: 'Tool names to withdraw.' }) }),
        execute: async ({ names }, ctx) => {
            log(`unregister_studio_tools(${names.join(', ')})`);
            const { accepted, refused, unknown } = catalogue.unregister(names);
            await reconcile();
            const lines = [accepted.length > 0 ? `Unregistered: ${accepted.join(', ')}.` : 'Unregistered nothing.'];
            if (refused.length > 0) lines.push(`Always on, so kept: ${refused.join(', ')}.`);
            if (unknown.length > 0) lines.push(`Not in the library: ${unknown.join(', ')}.`);
            if (accepted.length > 0) lines.push(REFRESH_NOTICE);
            return ctx.success(lines.join(' '));
        },
    });

    return [
        { tool: viewLibrary, readOnly: true },
        { tool: registerTools, readOnly: false },
        { tool: unregisterTools, readOnly: false },
    ];
}
