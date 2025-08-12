<script setup lang="ts">
/**
 * AG Grid Add Rows with Pinned Row Demo
 *
 * This demo shows how to implement a data entry form using AG Grid's
 * pinned row feature. Users can add new rows by filling in the top row.
 */
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

// Store rowData, fetched from external API
const rowData = ref<AthleteData[]>([]);

// Store Data Entered Into Pinned Row Cells (Auto updated by Grid)
const pinnedRowData = reactive<Partial<AthleteData>>({});

// Store reference to Grid API for use throughout the demo
const gridRef = ref();

// Load data on component mount
onMounted(() => {
  loadData();
});

// Fetches and processes data from the demo API
const loadData = async () => {
  try {
    // Fetch & Parse Data
    const response = await fetch(
      'https://www.ag-grid.com/example-assets/olympic-winners.json'
    );
    const data = await response.json();

    // Take a small sample and convert date strings to Date objects
    const sampleData = data.slice(3, 6).map((item: any) => ({
      ...item,
      date: parseDate(item.date),
    }));

    // Set Row Data
    rowData.value = sampleData;
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};

// Checks if a cell in the pinned row is empty
const isEmptyPinnedCell = (params: ValueFormatterParams) => {
  return (
    params.node?.rowPinned === 'top' &&
    (params.value == null || params.value === '')
  );
};

// Custom value formatter that handles both placeholders and data display
const valueFormatter = (params: ValueFormatterParams) => {
  // Show placeholder for empty pinned cells
  if (isEmptyPinnedCell(params)) {
    return `${params.colDef.headerName}...`;
  }

  // Format dates for display
  if (params.colDef.field === 'date') {
    return formatDate(params.value);
  }

  // Return plain value for all other cells
  return params.value;
};

  // Checks if all required fields in the pinned row are filled
  const isPinnedRowDataComplete = () => {
    return columnDefs.every((colDef) => {
      if (!colDef.field) return false;

      const v = pinnedRowData[colDef.field!];
      return v != null && v !== '';
    });
  };

// Handles cell editing completion - adds new row when input is complete
const onCellEditingStopped = (params: CellEditingStoppedEvent) => {
  try {
    // Only process pinned row edits
    if (params.rowPinned !== 'top') return;

    // Check all pinned row cells have a value
    if (isPinnedRowDataComplete()) {
      // Add the new row to the grid data
      const transaction = gridRef?.value?.api.applyTransaction({
          add: [pinnedRowData],
        });

        // Reset the input row for next entry
      Object.keys(pinnedRowData).forEach(key => {
        delete pinnedRowData[key as keyof AthleteData];
      });
      gridRef?.value?.api.setGridOption('pinnedTopRowData', [pinnedRowData]);

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

// Column definitions - specify fields, editors, and renderers
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
    cellEditor: 'agDateCellEditor', // Built-in Date Cell Editor
    valueFormatter, // Required, to override cellEditor formatter
  },
  {
    field: 'age',
    headerName: 'Age',
    valueFormatter, // Required, to override cellEditor formatter
  },
];

// Default column properties applied to all columns
const defaultColDef: ColDef = {
  flex: 1,
  editable: (params) => params.node.rowPinned === 'top', // Only allow editing for pinned rows
  valueFormatter,
  cellClassRules: {
    // Apply CSS Class to Pinned Cells with User Edits
    'pinned-cell-editing': (params: any) =>
      params.node.rowPinned && params.value,
  },
};

// Show row numbers for non-pinned rows
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
      :pinnedTopRowData="[pinnedRowData]"
      :rowNumbers="{ valueFormatter: rowNumbersFormatter }"
      @cell-editing-stopped="onCellEditingStopped"
      style="width: 100%; height: 100%"
    />
  </div>
</template>

<style scoped></style>