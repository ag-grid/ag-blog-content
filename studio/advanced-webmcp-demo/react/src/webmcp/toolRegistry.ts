import type { AgAiStudioTools, AgAiTool, AgStudioApi } from 'ag-studio';

/** A Studio tool the page can offer. */
export interface ToolEntry {
    name: string;
    /** One line for the tool library, so an agent can choose a tool without registering it first. */
    summary: string;
    readOnly: boolean;
    /** Published from the start and never withdrawn. */
    base: boolean;
    /** Called on every reconcile pass, so the tool always reflects the current dashboard. */
    build(): AgAiTool;
}

/**
 * Published before the agent asks for anything. Kept small because Chrome disables WebMCP for the
 * whole page if its tools and schemas exceed the browser's budget. These two describe the data and
 * the dashboard, which is enough for an agent to work out what else it needs.
 */
const BASE_TOOLS = new Set(['view_schema', 'view_report']);

function entry(name: string, summary: string, readOnly: boolean, build: () => AgAiTool): ToolEntry {
    return { name, summary, readOnly, base: BASE_TOOLS.has(name), build };
}

/**
 * Tool names must be stable and unique, but widget ids are free-form. Characters outside
 * `[a-z0-9_]` become underscores, and ids that collide after that get a numeric suffix.
 */
function configureToolNames(widgetIds: readonly string[]): Map<string, string> {
    const names = new Map<string, string>();
    const taken = new Set<string>();
    for (const widgetId of widgetIds) {
        const base = `configure_widget__${widgetId.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
        let name = base;
        for (let suffix = 2; taken.has(name); ++suffix) {
            name = `${base}_${suffix}`;
        }
        taken.add(name);
        names.set(widgetId, name);
    }
    return names;
}

/**
 * One configure tool per widget on the selected page. Binding the tool to a widget gives it that
 * widget type's config schema, so a valid configuration is a single call away. Those schemas are
 * the largest thing the page could publish, which is why none of these are published by default.
 */
function configureWidgetEntries(studio: AgAiStudioTools, api: AgStudioApi): ToolEntry[] {
    const state = api.getState();
    const widgets = state.pages.find(({ id }) => id === state.selectedPageId)?.widgets ?? {};
    const names = configureToolNames(Object.keys(widgets));

    return Object.entries(widgets).flatMap(([widgetId, config]) => {
        const widgetType = config?.type;
        // Without a type there is no config schema to bind to.
        if (widgetType == null) return [];
        const name = names.get(widgetId)!;
        return [
            entry(
                name,
                `Configure the ${widgetType} widget "${widgetId}". Large schema; register it only when changing that widget.`,
                false,
                () => studio.configureWidget({ widgetType, widgetId }, { name })
            ),
        ];
    });
}

/** Every Studio tool the page can offer, built against the current dashboard state. */
export function getToolEntries(studio: AgAiStudioTools, api: AgStudioApi): ToolEntry[] {
    return [
        entry('view_schema', 'Describe the tables, fields and calculated fields available.', true, () =>
            studio.viewSchema()
        ),
        entry('view_report', 'List the pages in the dashboard and which one is selected.', true, () =>
            studio.viewReport()
        ),
        entry('view_page', 'Describe the selected page and the widgets on it.', true, () => studio.viewPage()),
        entry('view_widget', 'Read one widget: its configuration, layout, filters and health issues.', true, () =>
            studio.viewWidget()
        ),
        entry('execute_query', 'Run a query against the dashboard data and return the rows.', true, () =>
            studio.executeQuery()
        ),
        entry('create_expression', 'Add a calculated field to the schema.', false, () => studio.createExpression()),
        entry('update_expression', 'Change an existing calculated field.', false, () => studio.updateExpression()),
        entry('delete_expression', 'Remove a calculated field.', false, () => studio.deleteExpression()),
        entry('add_widget', 'Add a widget to the selected page.', false, () => studio.addWidget()),
        entry('position_widget', 'Move or resize a widget on the selected page.', false, () => studio.positionWidget()),
        entry('remove_widget', 'Delete a widget from the selected page.', false, () => studio.removeWidget()),
        entry('add_page_filter', 'Filter the whole page.', false, () => studio.addPageFilter()),
        entry('remove_page_filter', 'Remove a page-level filter.', false, () => studio.removePageFilter()),
        entry('add_widget_filter', 'Filter one widget.', false, () => studio.addWidgetFilter()),
        entry('remove_widget_filter', 'Remove a filter from one widget.', false, () => studio.removeWidgetFilter()),
        ...configureWidgetEntries(studio, api),
    ];
}
