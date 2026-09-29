import type { AgAiStudioTools, AgAiTool, AgStudioApi } from 'ag-studio';

/**
 * One tool the page can offer. `build` is called on every reconcile pass rather than held, so each
 * instance reads the state it is reconciled against - a tool bound to a widget that has since been
 * deleted is never rebuilt, and so leaves the catalogue on its own.
 */
export interface StudioToolEntry {
    name: string;
    /** One line for the listing, so an agent can choose without registering anything first. */
    summary: string;
    readOnly: boolean;
    /** Registered from the start and never withdrawn. */
    base: boolean;
    build(): AgAiTool;
}

/**
 * The tools registered before an agent asks for anything. Deliberately small: a browser imposes a
 * budget on the tools and schemas a page may publish, and Chrome disables WebMCP for the whole
 * page when it is exceeded, so the default set has to leave room for whatever the agent then
 * chooses. These two describe the data and the dashboard's structure, which is enough to decide
 * what else is needed.
 */
const BASE_TOOL_NAMES = ['view_schema', 'view_report'];

/**
 * A WebMCP tool name has to be stable and unique for as long as the widget behind it exists, and
 * a widget id is free-form. Anything outside the conservative character set becomes an underscore,
 * and a collision between two ids that flatten to the same text takes a numeric suffix, so two
 * widgets never contend for one registration.
 */
function configureToolNames(widgetIds: readonly string[]): Map<string, string> {
    const taken = new Set<string>();
    const names = new Map<string, string>();
    for (const widgetId of widgetIds) {
        const flattened = widgetId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        let name = `configure_widget__${flattened}`;
        for (let suffix = 2; taken.has(name); ++suffix) {
            name = `configure_widget__${flattened}_${suffix}`;
        }
        taken.add(name);
        names.set(widgetId, name);
    }
    return names;
}

/**
 * One `configure_widget` per widget on the selected page. The built-in factory binds a listing to
 * one widget, so its config schema is the one for that widget's type - the thing that makes a
 * valid configuration reachable in a single call. Binding costs a tool name per widget, which is
 * what the rename is for, and it is why these are never registered by default: a dashboard's worth
 * of widget-configuration schemas is the single largest thing this page could publish.
 *
 * Note the rename moves the `aiToolDisplay` lookup too, which is keyed by tool name: harmless
 * here, because nothing renders these in Studio's chat panel, but a harness doing the same would
 * lose the widget-configuration row's presentation.
 */
function configureWidgetEntries(studio: AgAiStudioTools, api: AgStudioApi): StudioToolEntry[] {
    const state = api.getState();
    const page = state.pages.find(({ id }) => id === state.selectedPageId);
    const widgets = page?.widgets ?? {};
    const names = configureToolNames(Object.keys(widgets));

    const entries: StudioToolEntry[] = [];
    for (const [widgetId, config] of Object.entries(widgets)) {
        const widgetType = config?.type;
        // A widget whose state carries no type cannot pick a configuration schema, so it gets no
        // tool rather than one that would reject every call.
        if (widgetType == null) continue;
        const name = names.get(widgetId)!;
        entries.push({
            name,
            summary: `Configure the ${widgetType} widget "${widgetId}". Large schema; register it only when changing that widget.`,
            readOnly: false,
            base: false,
            build: () => studio.configureWidget({ widgetType, widgetId }, { name }),
        });
    }
    return entries;
}

/** Every Studio tool this page can offer, rebuilt against current state on each pass. */
export function studioToolEntries(studio: AgAiStudioTools, api: AgStudioApi): StudioToolEntry[] {
    const entry = (name: string, summary: string, readOnly: boolean, build: () => AgAiTool): StudioToolEntry => ({
        name,
        summary,
        readOnly,
        base: BASE_TOOL_NAMES.includes(name),
        build,
    });

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
