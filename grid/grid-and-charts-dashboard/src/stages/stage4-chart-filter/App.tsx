import { useCallback, useMemo, useRef, useState } from 'react';
import type { FilterModel, GridApi } from 'ag-grid-community';
import { DateRangeFilter, type DateRange } from '../../shared/DateRangeFilter';
import { formatCurrency, formatCurrencyCompact, formatInteger, formatMonthLong } from '../../shared/format';
import { KpiCard } from '../../shared/KpiCard';
import { fullDateRange, getChartData, getGridRows, getKpis, isMonthInRange, type Order } from './data';
import { OrdersGrid } from './OrdersGrid';
import { SpendChart } from './SpendChart';

export function App() {
    // Filter state lives here, above the widgets, so every widget can react to every filter.
    const [dateRange, setDateRange] = useState<DateRange>(fullDateRange);
    const [gridFilterModel, setGridFilterModel] = useState<FilterModel | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    // The grid owns its filters, so clearing them goes through the grid's API.
    const gridApi = useRef<GridApi<Order> | null>(null);

    // Each widget's data comes from data.ts.
    // Each dependency list shows which filters reach that widget.
    const gridRows = useMemo(() => getGridRows({ dateRange, selectedMonth }), [dateRange, selectedMonth]);
    const chartData = useMemo(
        () => getChartData({ dateRange, gridFilterModel, selectedMonth }),
        [dateRange, gridFilterModel, selectedMonth],
    );
    const kpis = useMemo(
        () => getKpis({ dateRange, gridFilterModel, selectedMonth }),
        [dateRange, gridFilterModel, selectedMonth],
    );

    // useCallback keeps these handlers the same between renders, so the chart and grid
    // don't redo their work needlessly.
    const handleDateRangeChange = useCallback((next: DateRange) => {
        // Never let the range run backwards: a start past the end pulls the end along with it.
        const range = next.start > next.end ? { start: next.start, end: next.start } : next;
        setDateRange(range);
        // Clear the selected month if it's no longer inside the range.
        setSelectedMonth((month) => (month && !isMonthInRange(month, range) ? null : month));
    }, []);

    // Clicking the selected bar again clears the selection.
    const handleMonthClick = useCallback(
        (month: string) => setSelectedMonth((current) => (current === month ? null : month)),
        [],
    );

    const handleGridReady = useCallback((api: GridApi<Order>) => {
        gridApi.current = api;
    }, []);

    // The grid then fires filterChanged, which sets gridFilterModel back to null.
    const clearGridFilters = () => gridApi.current?.setFilterModel(null);

    const resetAll = () => {
        setDateRange(fullDateRange);
        setSelectedMonth(null);
        clearGridFilters();
    };

    const isFullRange = dateRange.start === fullDateRange.start && dateRange.end === fullDateRange.end;
    const hasFilters = !isFullRange || selectedMonth != null || gridFilterModel != null;
    const gridFilterCount = gridFilterModel ? Object.keys(gridFilterModel).length : 0;

    return (
        <main className="dashboard">
            <div className="top-row">
                <header className="card title-card">
                    <h1>Procurement Spend</h1>
                    {/* Active-filter chips: show what's filtering the page; click one to clear it. */}
                    <div className="active-filters" aria-live="polite">
                        {selectedMonth && (
                            <button type="button" className="chip" onClick={() => setSelectedMonth(null)}>
                                Month: {formatMonthLong(selectedMonth)} <span aria-hidden>×</span>
                                <span className="visually-hidden">(clear)</span>
                            </button>
                        )}
                        {gridFilterModel && (
                            <button type="button" className="chip" onClick={clearGridFilters}>
                                Grid filters: {gridFilterCount} {gridFilterCount === 1 ? 'column' : 'columns'}{' '}
                                <span aria-hidden>×</span>
                                <span className="visually-hidden">(clear)</span>
                            </button>
                        )}
                        <button type="button" className="reset-button" onClick={resetAll} disabled={!hasFilters}>
                            Reset all filters
                        </button>
                    </div>
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
                    <p className="hint">Click a bar to filter the grid by month</p>
                </header>
                <div className="chart-container">
                    <SpendChart data={chartData} onMonthClick={handleMonthClick} />
                </div>
            </section>

            <section className="card panel grid-panel" aria-label="Purchase orders">
                <div className="grid-container">
                    <OrdersGrid rows={gridRows} onFilterModelChange={setGridFilterModel} onGridReady={handleGridReady} />
                </div>
            </section>
        </main>
    );
}
