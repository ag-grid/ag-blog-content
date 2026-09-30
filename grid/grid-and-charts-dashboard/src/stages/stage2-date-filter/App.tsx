import { useCallback, useMemo, useState } from 'react';
import { DateRangeFilter, type DateRange } from '../../shared/DateRangeFilter';
import { formatCurrency, formatCurrencyCompact, formatInteger } from '../../shared/format';
import { KpiCard } from '../../shared/KpiCard';
import { fullDateRange, getChartData, getGridRows, getKpis } from './data';
import { OrdersGrid } from './OrdersGrid';
import { SpendChart } from './SpendChart';

export function App() {
    // The page filter lives here, above the widgets, so every widget can use it.
    const [dateRange, setDateRange] = useState<DateRange>(fullDateRange);

    // Each widget's data comes from data.ts, and is worked out again only when the range changes.
    const gridRows = useMemo(() => getGridRows({ dateRange }), [dateRange]);
    const chartData = useMemo(() => getChartData({ dateRange }), [dateRange]);
    const kpis = useMemo(() => getKpis({ dateRange }), [dateRange]);

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
                </header>
                <div className="chart-container">
                    <SpendChart data={chartData} />
                </div>
            </section>

            <section className="card panel grid-panel" aria-label="Purchase orders">
                <div className="grid-container">
                    <OrdersGrid rows={gridRows} />
                </div>
            </section>
        </main>
    );
}
