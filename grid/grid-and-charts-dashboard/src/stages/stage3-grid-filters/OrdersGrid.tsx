import { useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    themeQuartz,
    type AutoGroupColumnDef,
    type ColDef,
    type FilterChangedEvent,
    type FilterModel,
    type GetRowIdParams,
    type INumberFilterParams,
    type ValueFormatterParams,
} from 'ag-grid-community';
import { formatCurrency, formatCurrencyCents, formatInteger } from '../../shared/format';
import { allMaterials, allSuppliers, type Order } from './data';

// Quartz theme, tuned to match the dashboard's colours and type.
const theme = themeQuartz.withParams({
    accentColor: '#2a78d6',
    fontFamily: 'inherit',
    fontSize: 13,
    headerFontWeight: 600,
    headerBackgroundColor: '#f6f6f4',
    borderColor: '#e6e5e0',
    wrapperBorderRadius: 8,
    spacing: 7,
});

// Number Filters offer three simple options, one condition each. "Greater than" comes first,
// so it's what typing in the floating filter does. `passesGridFilters` in data.ts applies the
// same rules to orders outside the grid, so keep the two in step.
// Filters test single orders, never group totals (the grid's `groupAggFiltering` stays off),
// which is what lets data.ts apply them one order at a time.
const numberFilterParams: INumberFilterParams = {
    filterOptions: ['greaterThan', 'lessThan', 'inRange'],
    maxNumConditions: 1,
    inRangeInclusive: true,
};

const columnDefs: ColDef<Order>[] = [
    { field: 'poId', headerName: 'PO', filter: false },
    { field: 'day', headerName: 'Order date', filter: false },
    // Group the orders by material, then supplier. These columns are hidden because the group
    // column shows them. Their Set Filters list every name, so each stays selectable when rows
    // are narrowed, and appear in the group column's filter menu.
    {
        field: 'material',
        rowGroup: true,
        hide: true,
        filter: 'agSetColumnFilter',
        filterParams: { values: allMaterials },
    },
    {
        field: 'supplier',
        rowGroup: true,
        hide: true,
        filter: 'agSetColumnFilter',
        filterParams: { values: allSuppliers },
    },
    // Group rows total their orders: summed quantity and spend, average unit cost.
    {
        field: 'quantity',
        type: 'rightAligned',
        aggFunc: 'sum',
        filter: 'agNumberColumnFilter',
        filterParams: numberFilterParams,
        valueFormatter: (p: ValueFormatterParams<Order, number>) =>
            p.value == null ? '' : formatInteger(p.value),
    },
    {
        field: 'unitCost',
        headerName: 'Unit cost',
        type: 'rightAligned',
        aggFunc: 'avg',
        filter: 'agNumberColumnFilter',
        filterParams: numberFilterParams,
        // On group rows the average arrives as { value, count }, so read its value.
        valueFormatter: (p: ValueFormatterParams<Order>) => {
            const cost = typeof p.value === 'object' ? p.value?.value : p.value;
            return cost == null ? '' : formatCurrencyCents(cost);
        },
    },
    {
        field: 'spend',
        type: 'rightAligned',
        aggFunc: 'sum',
        filter: 'agNumberColumnFilter',
        filterParams: numberFilterParams,
        valueFormatter: (p: ValueFormatterParams<Order, number>) =>
            p.value == null ? '' : formatCurrency(p.value),
    },
];

const defaultColDef: ColDef = { flex: 1, minWidth: 130, floatingFilter: true };

// The group column shows material > supplier, A to Z, with the number of orders in brackets.
// Its filter menu holds the material and supplier Set Filters.
const autoGroupColumnDef: AutoGroupColumnDef<Order> = {
    headerName: 'Material / Supplier',
    flex: 2,
    minWidth: 280,
    sort: 'asc',
    filter: 'agGroupColumnFilter',
};

// Stable row IDs let the grid update rows in place when the data changes,
// instead of throwing them away and rebuilding them.
const getRowId = (params: GetRowIdParams<Order>) => params.data.poId;

interface OrdersGridProps {
    rows: Order[];
    /** Called with the grid's column filters whenever they change, or null when there are none. */
    onFilterModelChange: (model: FilterModel | null) => void;
}

export function OrdersGrid({ rows, onFilterModelChange }: OrdersGridProps) {
    const handleFilterChanged = useCallback(
        (event: FilterChangedEvent<Order>) => {
            // Copy the grid's filters up to App; an empty model means no filters.
            const model = event.api.getFilterModel();
            onFilterModelChange(Object.keys(model).length ? model : null);
        },
        [onFilterModelChange],
    );

    return (
        <AgGridReact<Order>
            theme={theme}
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            suppressAggFuncInHeader
            getRowId={getRowId}
            onFilterChanged={handleFilterChanged}
        />
    );
}
