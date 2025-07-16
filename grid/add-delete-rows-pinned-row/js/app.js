/**
 * AG Grid Add/Delete Rows with Pinned Row Demo
 *
 * This demo shows how to implement a data entry form using AG Grid's
 * pinned row feature. Users can add new rows by filling in the top row.
 */

// =====================================
// Configuration & Data
// =====================================

const DATA_URL = 'https://www.ag-grid.com/example-assets/olympic-winners.json';

// State management - keep track of the input row being edited
let inputRow = {};
let gridApi;

// =====================================
// Utility Functions
// =====================================

/**
 * Formats a Date object to DD/MM/YYYY string
 */
function formatDate(date) {
  if (!(date instanceof Date)) return date;

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Converts DD/MM/YYYY string to Date object
 */
function parseDate(dateString) {
  const [day, month, year] = dateString.split('/');
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Checks if a cell in the pinned row is empty
 */
function isEmptyPinnedCell(params) {
  return (
    params.node.rowPinned === 'top' &&
    (params.value == null || params.value === '')
  );
}

// =====================================
// Data Processing
// =====================================

/**
 * Fetches and processes data from the demo API
 */
async function loadData() {
  try {
    const response = await fetch(DATA_URL);
    const data = await response.json();

    // Take a small sample and convert date strings to Date objects
    const sampleData = data.slice(3, 6).map((item) => ({
      ...item,
      date: parseDate(item.date),
    }));

    gridApi.setGridOption('rowData', sampleData);
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

// =====================================
// Grid Configuration
// =====================================

/**
 * Custom value formatter that handles both placeholders and data display
 */
function valueFormatter(params) {
  // Show placeholder for empty pinned cells
  if (isEmptyPinnedCell(params)) {
    return `${params.colDef.headerName}...`;
  }

  // Format dates for display
  if (params.colDef.field === 'date') {
    return formatDate(params.value);
  }

  return params.value;
}

// Show row numbers for non-pinned rows
const rowNumberOptions = {
  valueFormatter: (params) => {
    return params?.node?.rowPinned ? '' : params?.value;
  },
};

const cellClassRules = {
  'pinned-row-editing': (params) => params.node.rowPinned && params.value,
};

const rowClassRules = {
  'pinned-row': (params) => params.node.rowPinned,
};

/**
 * Column definitions - specify fields, editors, and renderers
 */
const columnDefs = [
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

/**
 * Default column properties applied to all columns
 */
const defaultColDef = {
  flex: 1,
  editable: true,
  valueFormatter,
  cellClassRules,
  enableCellChangeFlash: true,
};

// =====================================
// Event Handlers
// =====================================

/**
 * Called when the grid is ready - initialize API and load data
 */
function onGridReady(params) {
  gridApi = params.api;
  loadData();
}

/**
 * Checks if all required fields in the pinned row are filled
 */
function isInputRowComplete() {
  return columnDefs.every((colDef) => {
    const field = colDef.field;
    const value = inputRow[field];
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Handles cell editing completion - adds new row when input is complete
 */
function onCellEditingStopped(params) {
  // Only process pinned row edits
  if (params.rowPinned !== 'top') return;

  // Update the input row with the new value
  inputRow[params.colDef.field] = params.newValue;

  // If all fields are filled, add the new row to the grid
  if (isInputRowComplete()) {
    // Add the new row to the grid data
    const transaction = gridApi.applyTransaction({
      add: [inputRow],
    });

    // Flash the newly added row to draw attention
    gridApi.flashCells({
      rowNodes: transaction.add,
    });

    // Reset the input row for next entry
    inputRow = {};
    gridApi.setGridOption('pinnedTopRowData', [inputRow]);
  }
}

// =====================================
// Grid Options
// =====================================

const gridOptions = {
  columnDefs,
  defaultColDef,
  pinnedTopRowData: [inputRow], // Pin an empty row at the top for data entry
  rowNumbers: rowNumberOptions, // Show row numbers for non-pinned rows
  rowClassRules, // Style the pinned row differently
  onGridReady, // Init API & fetch data
  onCellEditingStopped, // Listen for pinned row edits
};

// =====================================
// Initialize Grid
// =====================================

document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector('#myGrid');
  agGrid.createGrid(gridDiv, gridOptions);
});
