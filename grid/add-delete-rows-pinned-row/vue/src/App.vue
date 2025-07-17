<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import {
  type ColDef,
  type CellEditingStoppedEvent,
  type ValueFormatterParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import SportRenderer from './components/SportRenderer.vue';
import { formatDate, parseDate } from './utils/dateUtils';
import type { AthleteData } from './types';
import './assets/main.css';

// Register all AG Grid modules for enterprise features and charts
ModuleRegistry.registerModules([AllEnterpriseModule]);

// State to hold the grid data fetched from API
const rowData = ref<AthleteData[]>([]);

// Reactive object for the pinned row input
const inputRow = reactive<Partial<AthleteData>>({});

// Grid component reference
const gridRef = ref();

// Fetch Olympic data on component mount
onMounted(() => {
  loadData();
});

/**
 * Loads athlete data from the AG Grid example API
 * Filters to a sample of 3 records and parses dates
 */
const loadData = async () => {
  try {
    const response = await fetch(
      'https://www.ag-grid.com/example-assets/olympic-winners.json'
    );
    const data = await response.json();

    // Take a sample of records and parse date strings to Date objects
    const sampleData = data.slice(3, 6).map((item: any) => ({
      ...item,
      date: parseDate(item.date),
    }));

    rowData.value = sampleData;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

/**
 * Checks if a cell in the pinned top row is empty
 * @param params - Value formatter parameters from AG Grid
 * @returns True if the cell is in the pinned row and has no value
 */
const isEmptyPinnedCell = (params: ValueFormatterParams) => {
  return (
    params.node?.rowPinned === 'top' &&
    (params.value == null || params.value === '')
  );
};

/**
 * Formats cell values, showing placeholder text for empty pinned cells
 * and properly formatting dates
 * @param params - Value formatter parameters from AG Grid
 * @returns Formatted value string
 */
const valueFormatter = (params: ValueFormatterParams) => {
  if (isEmptyPinnedCell(params)) {
    return `${params.colDef.headerName}...`;
  }

  if (params.colDef.field === 'date') {
    return formatDate(params.value);
  }

  return params.value;
};

  // Check all pinned row cells have a value
  const isInputRowComplete = () => {
    return columnDefs.every((colDef) => {
      const field = colDef.field;
      if (field) {
        const value = inputRow[field];
        return value !== undefined && value !== null && value !== '';
      }
      return false;
    });
  };

/**
 * Handles cell editing completion in the pinned top row
 * When all required fields are filled, adds a new row to the grid
 * @param params - Cell editing stopped event parameters
 */
const onCellEditingStopped = (params: CellEditingStoppedEvent) => {
  try {
    // Only process edits in the pinned top row
    if (params.rowPinned !== 'top') return;

    if (isInputRowComplete()) {
      // Add new row to data
      const transaction = gridRef?.value?.api.applyTransaction({
          add: [inputRow],
        });

        // Reset input row
      Object.keys(inputRow).forEach(key => {
        delete inputRow[key as keyof AthleteData];
      });
      gridRef?.value?.api.setGridOption('pinnedTopRowData', [inputRow]);

      // Flash the newly added row to draw attention
      // Note: add delay to ensure transaction & updates complete
      setTimeout(() => {
        gridRef.value?.api.flashCells({
          rowNodes: transaction?.add,
        });
      }, 100);
    }
  } catch (error) {
    console.error('Error handling cell edit:', error);
  }
};

// Column definitions for the grid
const columnDefs: ColDef<AthleteData>[] = [
  {
    field: 'athlete',
    headerName: 'Athlete',
  },
  {
    field: 'sport',
    headerName: 'Sport',
    cellRenderer: SportRenderer,
    cellEditor: 'agRichSelectCellEditor',
    cellEditorParams: {
      values: ['Swimming', 'Gymnastics', 'Cycling', 'Ski Jumping'],
      cellRenderer: SportRenderer,
    },
  },
  {
    field: 'date',
    headerName: 'Date',
    cellEditor: 'agDateCellEditor',
    valueFormatter,
  },
  {
    field: 'age',
    headerName: 'Age',
    valueFormatter,
  },
];

// Default column properties applied to all columns
const defaultColDef: ColDef = {
  flex: 1, // Columns will grow to fill available space
  editable: true, // All cells are editable
  valueFormatter,
  cellClassRules: {
    'pinned-cell-editing': (params: any) =>
      params.node.rowPinned && params.value,
  },
};

/**
 * Formats row numbers, hiding them for pinned rows
 * @param params - Value formatter parameters
 * @returns Empty string for pinned rows, otherwise the row number
 */
const rowNumbersFormatter = (params: ValueFormatterParams) => {
  return params?.node?.rowPinned ? '' : params?.value;
};
</script>

<template>
  <div style="height: 100vh">
    <ag-grid-vue
      ref="gridRef"
      :rowData="rowData"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      :pinnedTopRowData="[inputRow]"
      :rowNumbers="{ valueFormatter: rowNumbersFormatter }"
      @cell-editing-stopped="onCellEditingStopped"
      style="width: 100%; height: 100%"
    />
  </div>
</template>

<style scoped></style>