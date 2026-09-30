// All of this stage's data processing lives in this file.
// Components only display what the functions at the bottom return.
import type { FilterModel, NumberFilterModel } from 'ag-grid-community';
import type { DateRange } from '../../shared/DateRangeFilter';
import purchaseOrdersJson from '../../data/purchase-orders.json';
import materialsJson from '../../data/materials.json';
import suppliersJson from '../../data/suppliers.json';

/** One purchase order, cleaned up for display. The grid shows one row per order. */
export interface Order {
    poId: string;
    /** YYYY-MM-DD (UTC) */
    day: string;
    /** YYYY-MM (UTC) */
    month: string;
    material: string;
    supplier: string;
    quantity: number;
    unitCost: number;
    spend: number;
}

/** One chart bar. */
export interface MonthSpend {
    /** YYYY-MM */
    month: string;
    spend: number;
    /** Another month is selected, so this bar is drawn faded. */
    dimmed: boolean;
}

/** Every filter on the page, and where it comes from. */
export interface Filters {
    /** The page-level date inputs. */
    dateRange: DateRange;
    /** A copy of the grid's column filters, or null when there are none. */
    gridFilterModel: FilterModel | null;
    /** The month picked by clicking a chart bar, as YYYY-MM. */
    selectedMonth: string | null;
}

export interface Kpis {
    orderCount: number;
    spend: number;
}

// ---------------------------------------------------------------------------
// 1. Clean the raw data. Runs once, when the app loads.
// ---------------------------------------------------------------------------

// Orders only store IDs, so look up the display names.
const materialNames = new Map(materialsJson.map((m) => [m.materialId, m.name]));
const supplierNames = new Map(suppliersJson.map((s) => [s.supplierId, s.name]));

export const orders: Order[] = purchaseOrdersJson.map((po) => ({
    poId: po.poId,
    // ISO timestamps: the first 10 characters are the UTC day, the first 7 the UTC month.
    day: po.orderDate.slice(0, 10),
    month: po.orderDate.slice(0, 7),
    material: materialNames.get(po.materialId) ?? po.materialId,
    supplier: supplierNames.get(po.supplierId) ?? po.supplierId,
    quantity: po.quantity,
    unitCost: po.unitCost,
    spend: po.quantity * po.unitCost,
}));

/** Every material and supplier name, for the grid's Set Filters. */
export const allMaterials = [...new Set(orders.map((o) => o.material))].sort();
export const allSuppliers = [...new Set(orders.map((o) => o.supplier))].sort();

/** From the first order day to the last: the default, and widest, date range. */
const sortedDays = orders.map((o) => o.day).sort();
export const fullDateRange: DateRange = { start: sortedDays[0], end: sortedDays[sortedDays.length - 1] };

// ---------------------------------------------------------------------------
// 2. Filters
// ---------------------------------------------------------------------------

/** Days are YYYY-MM-DD strings, so plain string comparison puts them in the right order. */
function isInDateRange(order: Order, { start, end }: DateRange) {
    return order.day >= start && order.day <= end;
}

/** Is a YYYY-MM month inside the date range? */
export function isMonthInRange(month: string, { start, end }: DateRange) {
    return month >= start.slice(0, 7) && month <= end.slice(0, 7);
}

/**
 * Does an order pass the grid's column filters? The grid filters its own rows; this applies the
 * same filters to orders the grid isn't showing (other months), for the chart.
 * It handles the two filter types the grid offers (see `OrdersGrid.tsx`): Set Filters, and
 * Number Filters limited to one condition of "greater than", "less than" or "between".
 */
function passesGridFilters(order: Order, filterModel: FilterModel | null) {
    if (!filterModel) return true;
    // The filter model maps each filtered column (named after an Order field) to its filter.
    return Object.entries(filterModel).every(([field, model]) => {
        const value = order[field as keyof Order];
        if (model.filterType === 'set') return model.values.includes(value);
        if (model.filterType === 'number') return passesNumberFilter(value as number, model);
        return true;
    });
}

function passesNumberFilter(value: number, { type, filter, filterTo }: NumberFilterModel) {
    if (filter == null) return true;
    switch (type) {
        case 'greaterThan':
            return value > filter;
        case 'lessThan':
            return value < filter;
        case 'inRange': // the grid is set to include both ends of the range
            return filterTo == null || (value >= filter && value <= filterTo);
        default:
            return true;
    }
}

// ---------------------------------------------------------------------------
// 3. Totals
// ---------------------------------------------------------------------------

/** Every month from the range's start to its end, as YYYY-MM. */
function monthsBetween({ start, end }: DateRange) {
    const months: string[] = [];
    const cursor = new Date(`${start.slice(0, 7)}-01T00:00:00Z`);
    const lastMonth = end.slice(0, 7);
    while (cursor.toISOString().slice(0, 7) <= lastMonth) {
        months.push(cursor.toISOString().slice(0, 7));
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return months;
}

/** Total spend per month, with a bar for every month in the range (empty months show as 0). */
function spendPerMonth(orders: Order[], range: DateRange, selectedMonth: string | null): MonthSpend[] {
    const spendByMonth = new Map<string, number>();
    for (const order of orders) {
        spendByMonth.set(order.month, (spendByMonth.get(order.month) ?? 0) + order.spend);
    }
    return monthsBetween(range).map((month) => ({
        month,
        spend: spendByMonth.get(month) ?? 0,
        dimmed: selectedMonth != null && month !== selectedMonth,
    }));
}

function totals(orders: Order[]): Kpis {
    return {
        orderCount: orders.length,
        spend: orders.reduce((sum, order) => sum + order.spend, 0),
    };
}

// ---------------------------------------------------------------------------
// 4. What each widget shows. Each function takes only the filters that reach that widget.
// ---------------------------------------------------------------------------

/** Grid: the date range and the chart's selected month. The grid applies its own column filters. */
export function getGridRows({ dateRange, selectedMonth }: Pick<Filters, 'dateRange' | 'selectedMonth'>) {
    const inRange = orders.filter((order) => isInDateRange(order, dateRange));
    return selectedMonth ? inRange.filter((order) => order.month === selectedMonth) : inRange;
}

/**
 * Chart: the date range and the grid's filters. The chart's own month selection doesn't remove
 * any data, it only dims the other bars, so every month stays visible and clickable.
 */
export function getChartData({ dateRange, gridFilterModel, selectedMonth }: Filters) {
    const chartOrders = orders.filter(
        (order) => isInDateRange(order, dateRange) && passesGridFilters(order, gridFilterModel),
    );
    return spendPerMonth(chartOrders, dateRange, selectedMonth);
}

/** KPIs: every filter, so they total exactly the orders the grid is showing. */
export function getKpis({ dateRange, gridFilterModel, selectedMonth }: Filters) {
    const gridRows = getGridRows({ dateRange, selectedMonth });
    return totals(gridRows.filter((order) => passesGridFilters(order, gridFilterModel)));
}
