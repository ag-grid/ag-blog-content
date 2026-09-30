import { useMemo } from 'react';
import { AgCharts } from 'ag-charts-react';
import type {
    AgAxisLabelFormatterParams,
    AgBarSeriesItemStylerParams,
    AgBarSeriesTooltipRendererParams,
    AgCartesianChartOptions,
} from 'ag-charts-community';
import { formatCurrency, formatCurrencyCompact, formatMonth, formatMonthLong } from '../../shared/format';
import type { MonthSpend } from './data';

const BAR_FILL = '#2a78d6';
const BAR_FILL_DIMMED = '#b7d3f6';

// These are defined outside the component so they are the same functions on every render,
// which lets AG Charts reuse its work between updates.

// Bars for months other than the selected one are drawn in a lighter blue.
const itemStyler = ({ datum }: AgBarSeriesItemStylerParams<MonthSpend>) => ({
    fill: datum?.dimmed ? BAR_FILL_DIMMED : BAR_FILL,
});

const tooltipRenderer = ({ datum }: AgBarSeriesTooltipRendererParams<MonthSpend>) => ({
    heading: formatMonthLong(datum.month),
    data: [{ label: 'Spend', value: formatCurrency(datum.spend) }],
});

const xLabelFormatter = ({ value }: AgAxisLabelFormatterParams) => formatMonth(value);
const yLabelFormatter = ({ value }: AgAxisLabelFormatterParams) => formatCurrencyCompact(value);

interface SpendChartProps {
    data: MonthSpend[];
    onMonthClick: (month: string) => void;
}

export function SpendChart({ data, onMonthClick }: SpendChartProps) {
    // Only rebuild the options when the data or the click handler changes.
    const options = useMemo<AgCartesianChartOptions<MonthSpend>>(
        () => ({
            data,
            background: { visible: false },
            padding: { top: 8, right: 8, bottom: 0, left: 0 },
            series: [
                {
                    type: 'bar',
                    xKey: 'month',
                    yKey: 'spend',
                    yName: 'Spend',
                    cursor: 'pointer',
                    cornerRadius: 4,
                    fill: BAR_FILL,
                    itemStyler,
                    tooltip: { renderer: tooltipRenderer },
                    // A bar click tells App which month was clicked.
                    listeners: {
                        seriesNodeClick: (event) => onMonthClick(event.datum.month),
                    },
                },
            ],
            axes: {
                x: {
                    type: 'category',
                    paddingInner: 0.25,
                    label: { formatter: xLabelFormatter, color: '#52514e' },
                },
                y: {
                    type: 'number',
                    label: { formatter: yLabelFormatter, color: '#52514e' },
                    gridLine: { style: [{ stroke: '#ecebe7' }] },
                },
            },
            legend: { enabled: true, position: 'top', toggleSeries: false },
        }),
        [data, onMonthClick],
    );

    return <AgCharts options={options} style={{ height: '100%' }} />;
}
