<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
import type {
  IOlympicData,
  AddRowPosition,
  ICellSelectionBounds,
} from './types';

// Register all AG Grid modules for enterprise features and charts
ModuleRegistry.registerModules([AllEnterpriseModule]);

// State to hold the grid data fetched from API
const rowData = ref<IOlympicData[]>([]);

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
  flex: 1, // Columns will grow to fill available space
  minWidth: 100, // Minimum column width
  editable: true, // All cells are editable
  resizable: true, // Columns can be resized
};

// Grid options
const editType = 'fullRow';
const cellSelection = true;
const rowNumbers = true;

// Grid ready event handler
const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api;
};

// Fetch Olympic data on component mount
onMounted(async () => {
  try {
    const response = await fetch(
      'https://www.ag-grid.com/example-assets/olympic-winners.json'
    );
    const json = await response.json();
    rowData.value = json;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

/**
 * Extracts information about the currently selected cell range
 * @returns Object with start/end row indices and count, or undefined if no selection
 */
const getCellSelectionBounds = (): ICellSelectionBounds | undefined => {
  try {
    // Get & Validate Cell Ranges
    const cellRanges = gridApi.value?.getCellRanges();
    if (!cellRanges || cellRanges.length < 0) throw 'No cells selected!';
    if (!cellRanges[0].startRow || !cellRanges[0].endRow)
      throw 'Could not find selected Cell Range';

    // Get Start, End & Number of Cells Selected
    const cellRangeStartRowIndex = cellRanges[0].startRow.rowIndex;
    const cellRangeEndRowIndex = cellRanges[0].endRow.rowIndex;

    // Calculate row count - add 1 to account for zero-based indexing
    const rowCount =
      Math.abs(cellRangeEndRowIndex - cellRangeStartRowIndex) + 1;

    // Return data to custom context menu
    return { cellRangeStartRowIndex, cellRangeEndRowIndex, rowCount };
  } catch (e) {
    console.error(e);
  }
};

/**
 * Adds empty rows to the grid based on the current cell selection
 * @param position - Whether to insert rows 'above' or 'below' the selection
 * @param cellSelectionBounds - Information about the selected cell range
 */
const addRows = (
  position: AddRowPosition,
  cellSelectionBounds: ICellSelectionBounds
) => {
  try {
    // Get Start / End Row Index from Cell Selection
    const { cellRangeStartRowIndex, cellRangeEndRowIndex } =
      cellSelectionBounds;

    // Create array of empty row objects matching the selection size
    const newRows = Array(cellSelectionBounds.rowCount)
      .fill(null)
      .map(() => ({}));

    // Calculate insertion index based on position
    // 'above': insert at the minimum index
    // 'below': insert after the maximum index
    const insertIndex =
      position === 'above'
        ? Math.min(cellRangeStartRowIndex, cellRangeEndRowIndex)
        : Math.max(cellRangeStartRowIndex, cellRangeEndRowIndex) + 1;

    // Apply transaction to add new rows to the grid
    const result = gridApi.value?.applyTransaction({
      add: newRows,
      addIndex: insertIndex,
    });

    if (result && result?.add?.length > 0) {
      // Delay to ensure DOM updates are complete
      setTimeout(() => {
        // Clear existing cell selection
        gridApi.value?.clearCellSelection();
        // Focus on the first cell of the first new row
        gridApi.value?.setFocusedCell(
          insertIndex,
          columnDefs[0].field ?? ''
        );
        // Start editing mode (triggers full-row editing due to editType='fullRow')
        gridApi.value?.startEditingCell({
          rowIndex: insertIndex,
          colKey: columnDefs[0]?.field ?? '',
        });
      }, 100);
    }
  } catch (error) {
    console.error(`Error adding rows ${position}:`, error);
  }
};

/**
 * Deletes rows from the grid based on the current cell selection
 * @param cellSelectionBounds - Information about the selected cell range
 */
const deleteRows = (cellSelectionBounds: ICellSelectionBounds) => {
  try {
    const { cellRangeStartRowIndex, cellRangeEndRowIndex } =
      cellSelectionBounds;

    // Determine the actual start and end indices (selection can be made in either direction)
    const start = Math.min(cellRangeStartRowIndex, cellRangeEndRowIndex);
    const end = Math.max(cellRangeStartRowIndex, cellRangeEndRowIndex);

    // Collect all row data objects to be removed
    const rowDataToRemove = [];
    for (let i = start; i <= end; i++) {
      const node = gridApi.value?.getDisplayedRowAtIndex(i);
      if (node?.data) rowDataToRemove.push(node.data);
    }

    // Exit early if no rows to remove
    if (rowDataToRemove.length === 0) return;

    // Remove rows via transaction API
    gridApi.value?.applyTransaction({ remove: rowDataToRemove });

    // Clear any remaining cell selection
    gridApi.value?.clearCellSelection();
  } catch (error) {
    console.error('Error deleting rows:', error);
  }
};

/**
 * Builds custom context menu items based on cell selection:
 * Adds options for Adding rows above & below current selection
 * Adds option for deleting currently selected rows
 * @param params - Context menu parameters from AG-Grid
 * @returns Array of menu items including custom row operations and default items
 */
const getContextMenuItems = (
  params: GetContextMenuItemsParams
): (DefaultMenuItem | MenuItemDef)[] => {
  // Get information about the current cell selection
  const cellSelectionBounds = getCellSelectionBounds();

  if (cellSelectionBounds) {
    // Build dynamic label showing number of rows selected
    const rowCount = cellSelectionBounds?.rowCount;
    const rowLabel = `${rowCount} Row${rowCount !== 1 ? 's' : ''}`;

    // Return custom menu items for row operations
    return [
      {
        name: `Insert ${rowLabel} Above`,
        action: () => addRows('above', cellSelectionBounds),
        icon: '<span class="ag-icon ag-icon-plus"></span>',
      },
      {
        name: `Insert ${rowLabel} Below`,
        action: () => addRows('below', cellSelectionBounds),
        icon: '<span class="ag-icon ag-icon-plus"></span>',
      },
      'separator',
      {
        name: `Delete ${rowLabel}`,
        action: () => deleteRows(cellSelectionBounds),
        icon: '<span class="ag-icon ag-icon-minus"></span>',
      },
      // Include default menu items (copy, paste, export, etc.)
      ...(params.defaultItems ?? []),
    ];
  } else {
    // No selection - show only default menu items
    return params?.defaultItems ?? [];
  }
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