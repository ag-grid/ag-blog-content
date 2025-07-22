<script setup lang="ts">
import { ref } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import {
  type ColDef,
  type DefaultMenuItem,
  type GetContextMenuItemsParams,
  type MenuItemDef,
  ModuleRegistry,
  type GridApi,
  type GridReadyEvent,
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import type { IOlympicData, ICellSelectionBounds } from './types';

// Register all AG Grid modules for enterprise features and charts
ModuleRegistry.registerModules([AllEnterpriseModule]);

// State to hold the grid data fetched from API
const rowData = ref<IOlympicData[] | undefined>(undefined);

// Grid API reference
const gridApi = ref<GridApi | null>(null);

// Column definitions for the grid
const columnDefs: ColDef[] = [
  { field: 'athlete', minWidth: 200 },
  { field: 'age' },
  { field: 'country', minWidth: 200 },
  { field: 'year' },
  { field: 'date', minWidth: 180 },
  { field: 'sport', minWidth: 200 },
  { field: 'gold' },
  { field: 'silver' },
  { field: 'bronze' },
  { field: 'total' },
];

// Default column properties applied to all columns
const defaultColDef: ColDef = {
  flex: 1,
  minWidth: 100,
  editable: true,
};

// Grid options
const editType = 'fullRow';
const cellSelection = true;
const rowNumbers = true;

const onGridReady = async (params: GridReadyEvent) => {
  // Set API
  gridApi.value = params.api;

  // Fetch Data
  const response = await fetch(
    'https://www.ag-grid.com/example-assets/olympic-winners.json'
  );
  const json = await response.json();
  rowData.value = json;
};

/**
 * Extracts information about the currently selected cell range or clicked row
 *
 * If a cell range is selected, returns normalized start/end indices and a row count.
 * If no range is selected, returns the index of the rowNode the user clicked on
 */
const getCellSelectionBounds = (
  params: GetContextMenuItemsParams
): ICellSelectionBounds => {
  // Get cell ranges from the grid API
  const cellRanges = gridApi.value?.getCellRanges();

  // Fallback to clicked row if no cell range is selected
  if (!cellRanges || !cellRanges[0]?.startRow || !cellRanges[0]?.endRow) {
    const rowIndex = params.node?.rowIndex || 0;
    return { startIndex: rowIndex, endIndex: rowIndex, rowCount: 1 };
  }

  // Extract row indices from the first cell range
  const cellRangeStartRowIndex = cellRanges[0].startRow.rowIndex;
  const cellRangeEndRowIndex = cellRanges[0].endRow.rowIndex;

  // Calculate total rows in selection (inclusive)
  const rowCount =
    Math.abs(cellRangeEndRowIndex - cellRangeStartRowIndex) + 1;

  // Normalize indices since selection can be made in either direction
  const startIndex = Math.min(cellRangeStartRowIndex, cellRangeEndRowIndex);
  const endIndex = Math.max(cellRangeStartRowIndex, cellRangeEndRowIndex);

  // Return normalized selection bounds
  return { startIndex, endIndex, rowCount };
};

// Clear selection and focus on the first new row for immediate editing
const startEditingCell = (insertIndex: number, firstColumn: string) => {
  gridApi.value?.clearCellSelection();
  gridApi.value?.setFocusedCell(insertIndex, firstColumn);
  gridApi.value?.startEditingCell({
    rowIndex: insertIndex,
    colKey: firstColumn,
  });
};

/**
 * Adds X number of empty rows to the grid, either above or below the
 * currently selected cell range, based on the number of selected rows.
 */
const addRows = (
  rowCount: number,
  startIndex?: number,
  endIndex?: number
) => {
  // Create empty row objects for insertion
  const newRows = Array.from({ length: rowCount }, () => ({}));

  // Determine insertion point
  const insertIndex = startIndex || endIndex || 0;

  // Insert rows at the specified index
  const result = gridApi.value?.applyTransaction({
    add: newRows,
    addIndex: insertIndex,
  });

  // If rows are added, focus on and start editing first new cell
  if (result && result?.add?.length > 0) {
    // Wait for next frame to ensure grid has processed the transaction
    requestAnimationFrame(() => {
      startEditingCell(insertIndex, columnDefs[0].field || '');
    });
  }
};

// Deletes rows from the grid within the specified range
const deleteRows = (startIndex: number, endIndex: number) => {
  // Collect row data within the specified range
  const rowDataToRemove = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const node = gridApi.value?.getDisplayedRowAtIndex(i);
    if (node?.data) {
      rowDataToRemove.push(node.data);
    }
  }

  // Skip removal if no valid rows found
  if (rowDataToRemove.length === 0) return;

  // Remove collected rows from the grid
  gridApi.value?.applyTransaction({ remove: rowDataToRemove });

  // Clear selection after deletion
  gridApi.value?.clearCellSelection();
};

/**
 * Builds custom context menu items based on cell selection:
 * Adds options for Adding rows above & below current selection
 * Adds option for deleting currently selected rows
 */
const getContextMenuItems = (
  params: GetContextMenuItemsParams
): (DefaultMenuItem | MenuItemDef)[] => {
  // Get selection bounds (either from cell range or clicked row)
  const { startIndex, endIndex, rowCount } = getCellSelectionBounds(params);

  // Create pluralized label for menu items
  const rowLabel = `${rowCount} Row${rowCount !== 1 ? 's' : ''}`;

  // Build context menu with row manipulation options
  return [
    {
      name: `Insert ${rowLabel} Above`,
      action: () => addRows(rowCount, startIndex),
      icon: '<span class="ag-icon ag-icon-plus"></span>',
    },
    {
      name: `Insert ${rowLabel} Below`,
      action: () => addRows(rowCount, endIndex + 1),
      icon: '<span class="ag-icon ag-icon-plus"></span>',
    },
    'separator',
    {
      name: `Delete ${rowLabel}`,
      action: () => deleteRows(startIndex, endIndex),
      icon: '<span class="ag-icon ag-icon-minus"></span>',
    },
    // Include default menu items (copy, paste, export, etc.)
    ...(params.defaultItems ?? []),
  ];
};
</script>

<template>
  <div style="height: 100vh">
    <ag-grid-vue
      :rowData="rowData"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      :getContextMenuItems="getContextMenuItems"
      :editType="editType"
      :cellSelection="cellSelection"
      :rowNumbers="rowNumbers"
      @grid-ready="onGridReady"
      style="width: 100%; height: 100%"
    />
  </div>
</template>

<style scoped></style>