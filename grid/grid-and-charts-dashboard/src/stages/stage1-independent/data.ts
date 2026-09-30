// All of this stage's data processing lives in this file.
// Components only display what the functions at the bottom return.
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

// Generate orders array, joining the raw data with the display names and calculating the spend for each order.
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

/** From the first order day to the last: the chart shows every month in between. */
const sortedDays = orders.map((o) => o.day).sort();
const fullDateRange: DateRange = {
  start: sortedDays[0],
  end: sortedDays[sortedDays.length - 1],
};

/** Every material and supplier name, for the grid's Set Filters. */
export const allMaterials = [...new Set(orders.map((o) => o.material))].sort();
export const allSuppliers = [...new Set(orders.map((o) => o.supplier))].sort();

// ---------------------------------------------------------------------------
// 2. Totals
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
function spendPerMonth(orders: Order[], range: DateRange): MonthSpend[] {
  const spendByMonth = new Map<string, number>();
  for (const order of orders) {
    spendByMonth.set(
      order.month,
      (spendByMonth.get(order.month) ?? 0) + order.spend,
    );
  }
  return monthsBetween(range).map((month) => ({
    month,
    spend: spendByMonth.get(month) ?? 0,
  }));
}

function totals(orders: Order[]): Kpis {
  return {
    orderCount: orders.length,
    spend: orders.reduce((sum, order) => sum + order.spend, 0),
  };
}

// ---------------------------------------------------------------------------
// 3. What each widget shows. No filters yet: every widget shows all the data.
// ---------------------------------------------------------------------------

/** Grid: every order. The grid applies its own column filters. */
export function getGridRows() {
  return orders;
}

/** Chart: every order, one bar per month. */
export function getChartData() {
  return spendPerMonth(orders, fullDateRange);
}

/** KPIs: every order. */
export function getKpis() {
  return totals(orders);
}
