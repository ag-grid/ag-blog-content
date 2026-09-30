import { useCallback, useMemo, useState } from 'react';
import type { FilterModel } from 'ag-grid-community';
import { DateRangeFilter, type DateRange } from '../../shared/DateRangeFilter';
import { formatCurrency, formatCurrencyCompact, formatInteger } from '../../shared/format';
import { KpiCard } from '../../shared/KpiCard';
import { fullDateRange, getChartData, getGridRows, getKpis } from './data';
import { OrdersGrid } from './OrdersGrid';
import { SpendChart } from './SpendChart';

export function App() {
    // Filter state lives here, above the widgets, so every widget can react to every filter.
    const [dateRange, setDateRange] = useState<DateRange>(fullDateRange);
    const [gridFilterModel, setGridFilterModel] = useState<FilterModel | null>(null);

    // Each widget's data comes from data.ts.
    // Each dependency list shows which filters reach that widget.
    const gridRows = useMemo(() => getGridRows({ dateRange }), [dateRange]);
    const chartData = useMemo(
        () => getChartData({ dateRange, gridFilterModel }),
        [dateRange, gridFilterModel],
    );
    const kpis = useMemo(() => getKpis({ dateRange, gridFilterModel }), [dateRange, gridFilterModel]);

    // useCallback keeps this handler the same between renders.
    const handleDateRangeChange = useCallback((next: DateRange) => {
        // Never let the range run backwards: a start past the end pulls the end along with it.
        setDateRange(next.start > next.end ? { start: next.start, end: next.start } : next);
    }, []);

    return (
        <main className="dashboard">
            <div className="top-row">
                <header className="card title-card">
                    <h1>Procurement Spend</h1>
                </header>
                <section className="card filter-card" aria-label="Date range">
                    <DateRangeFilter
                        value={dateRange}
                        min={fullDateRange.start}
                        max={fullDateRange.end}
                        onChange={handleDateRangeChange}
                    />
                </section>
            </div>

            <div className="kpi-row">
                <KpiCard label="Total purchase orders" value={formatInteger(kpis.orderCount)} caption="Count of orders" />
                <KpiCard
                    label="Total spend"
                    value={formatCurrencyCompact(kpis.spend)}
                    caption="Sum of quantity × unit cost"
                    title={formatCurrency(kpis.spend)}
                />
            </div>

            <section className="card panel">
                <header className="panel-header">
                    <h2>Total spend per month</h2>
                    <p className="hint">Follows the grid's filters</p>
                </header>
                <div className="chart-container">
                    <SpendChart data={chartData} />
                </div>
            </section>

            <section className="card panel grid-panel" aria-label="Purchase orders">
                <div className="grid-container">
                    <OrdersGrid rows={gridRows} onFilterModelChange={setGridFilterModel} />
                </div>
            </section>
        </main>
    );
}
