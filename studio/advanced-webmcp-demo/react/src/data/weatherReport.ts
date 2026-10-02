import type { AgReportState } from 'ag-studio';

/**
 * The starting dashboard: a finished temperature page, an unfinished precipitation page for an
 * agent to complete, and a blank page. Widgets reference fields and measures from `weatherData.ts`.
 */
export const weatherReport: AgReportState = {
    pages: [
        // Page 1: a complete, titled temperature report.
        {
            id: 'temperature',
            widgets: {
                'temp-heading': {
                    type: 'text',
                    dataMapping: {},
                    format: {
                        style: { text: 'Global City Temperatures', typography: { fontSize: 20, fontWeight: 'bold' } },
                    },
                },
                'kpi-avg-high': {
                    type: 'value',
                    dataMapping: { value: [{ id: 'avgHigh' }] },
                    format: { caption: { enabled: true, text: 'Avg High' } },
                },
                'kpi-avg-low': {
                    type: 'value',
                    dataMapping: { value: [{ id: 'avgLow' }] },
                    format: { caption: { enabled: true, text: 'Avg Low' } },
                },
                'kpi-avg-range': {
                    type: 'value',
                    dataMapping: { value: [{ id: 'avgTempRange' }] },
                    format: { caption: { enabled: true, text: 'Avg Daily Range' } },
                },
                'temp-trend': {
                    type: 'line-chart',
                    dataMapping: {
                        categoryKey: [{ id: 'calendar::year' }],
                        valueKey: [{ id: 'avgHigh' }, { id: 'avgLow' }],
                        tooltipKey: [],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Average Temperature by Year',
                            typography: { fontSize: 16, fontWeight: 'bold' },
                        },
                    },
                },
                'record-highs': {
                    type: 'column-chart-grouped',
                    dataMapping: {
                        categoryKey: [{ id: 'cities.city' }],
                        valueKey: [{ id: 'weather.tmax', aggregation: 'max' }],
                        tooltipKey: [{ id: 'cities.country' }],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Record High Temperature by City',
                            typography: { fontSize: 16, fontWeight: 'bold' },
                        },
                    },
                },
                'range-by-band': {
                    type: 'column-chart-grouped',
                    dataMapping: {
                        categoryKey: [{ id: 'cities.latitudeBand' }],
                        valueKey: [{ id: 'avgTempRange' }],
                        tooltipKey: [],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Average Daily Temperature Range by Climate Band',
                            typography: { fontSize: 16, fontWeight: 'bold' },
                        },
                    },
                },
                'daily-grid': {
                    type: 'grid',
                    dataMapping: {
                        cols: [
                            { id: 'cities.city' },
                            { id: 'weather.date' },
                            { id: 'weather.tmax', aggregation: 'avg' },
                            { id: 'weather.tmin', aggregation: 'avg' },
                            { id: 'tempRange', aggregation: 'avg' },
                            { id: 'weather.prcp', aggregation: 'sum' },
                        ],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Daily Observations',
                            typography: { fontSize: 16, fontWeight: 'bold' },
                        },
                        style: { theme: { rowHeight: 28 } },
                    },
                },
            },
            widgetLayout: {
                'temp-heading': { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 3 },
                'kpi-avg-high': { xTrack: 0, yTrack: 3, xSpan: 8, ySpan: 8 },
                'kpi-avg-low': { xTrack: 8, yTrack: 3, xSpan: 8, ySpan: 8 },
                'kpi-avg-range': { xTrack: 16, yTrack: 3, xSpan: 8, ySpan: 8 },
                'temp-trend': { xTrack: 0, yTrack: 11, xSpan: 24, ySpan: 22 },
                'record-highs': { xTrack: 0, yTrack: 33, xSpan: 12, ySpan: 26 },
                'range-by-band': { xTrack: 12, yTrack: 33, xSpan: 12, ySpan: 26 },
                'daily-grid': { xTrack: 0, yTrack: 59, xSpan: 24, ySpan: 34 },
            },
            filter: { page: [] },
        },
        // Page 2: a deliberately unfinished precipitation report.
        {
            id: 'precipitation',
            widgets: {
                'precip-heading': {
                    type: 'text',
                    dataMapping: {},
                    format: {
                        style: {
                            text: 'Precipitation (work in progress)',
                            typography: { fontSize: 20, fontWeight: 'bold' },
                        },
                    },
                },
                'rain-by-city': {
                    type: 'column-chart-grouped',
                    dataMapping: {
                        categoryKey: [{ id: 'cities.city' }],
                        valueKey: [{ id: 'totalRainfall' }],
                        tooltipKey: [{ id: 'cities.country' }],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Total Rainfall by City',
                            typography: { fontSize: 16, fontWeight: 'bold' },
                        },
                    },
                },
                'wet-days-by-band': {
                    type: 'column-chart-grouped',
                    dataMapping: {
                        categoryKey: [{ id: 'cities.latitudeBand' }],
                        valueKey: [{ id: 'wetDays' }],
                        tooltipKey: [],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Wet Days by Climate Band',
                            typography: { fontSize: 16, fontWeight: 'bold' },
                        },
                    },
                },
            },
            widgetLayout: {
                'precip-heading': { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 3 },
                'rain-by-city': { xTrack: 0, yTrack: 3, xSpan: 12, ySpan: 26 },
                'wet-days-by-band': { xTrack: 12, yTrack: 3, xSpan: 12, ySpan: 26 },
            },
            filter: { page: [] },
        },
        // Page 3: a blank canvas, ready for editing.
        {
            id: 'blank',
            widgets: {},
            widgetLayout: {},
            filter: { page: [] },
        },
    ],
    selectedPageId: 'temperature',
    panels: {
        filters: { collapsed: false },
        edit: { collapsed: true },
        data: { collapsed: true },
    },
};
