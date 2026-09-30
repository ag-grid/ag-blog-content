import { useMemo } from 'react';
import { AgCharts } from 'ag-charts-react';
import type {
    AgAxisLabelFormatterParams,
    AgBarSeriesTooltipRendererParams,
    AgCartesianChartOptions,
} from 'ag-charts-community';
import { formatCurrency, formatCurrencyCompact, formatMonth, formatMonthLong } from '../../shared/format';
import type { MonthSpend } from './data';

const BAR_FILL = '#2a78d6';

// These are defined outside the component so they are the same functions on every render,
// which lets AG Charts reuse its work between updates.

const tooltipRenderer = ({ datum }: AgBarSeriesTooltipRendererParams<MonthSpend>) => ({
    heading: formatMonthLong(datum.month),
    data: [{ label: 'Spend', value: formatCurrency(datum.spend) }],
});

const xLabelFormatter = ({ value }: AgAxisLabelFormatterParams) => formatMonth(value);
const yLabelFormatter = ({ value }: AgAxisLabelFormatterParams) => formatCurrencyCompact(value);

interface SpendChartProps {
    data: MonthSpend[];
}

export function SpendChart({ data }: SpendChartProps) {
    // Only rebuild the options when the data changes.
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
                    cornerRadius: 4,
                    fill: BAR_FILL,
                    tooltip: { renderer: tooltipRenderer },
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
        [data],
    );

    return <AgCharts options={options} style={{ height: '100%' }} />;
}
