import { formatCurrency, formatCurrencyCompact, formatInteger } from '../../shared/format';
import { KpiCard } from '../../shared/KpiCard';
import { getChartData, getGridRows, getKpis } from './data';
import { OrdersGrid } from './OrdersGrid';
import { SpendChart } from './SpendChart';

// Nothing can change yet, so each widget's data is worked out once, when the app loads.
const gridRows = getGridRows();
const chartData = getChartData();
const kpis = getKpis();

export function App() {
    return (
        <main className="dashboard">
            <div className="top-row">
                <header className="card title-card">
                    <h1>Procurement Spend</h1>
                </header>
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
