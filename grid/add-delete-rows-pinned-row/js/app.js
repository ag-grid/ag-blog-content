/**
 * AG Grid Add/Delete Rows with Pinned Row Demo
 *
 * This demo shows how to implement a data entry form using AG Grid's
 * pinned row feature. Users can add new rows by filling in the top row.
 */

// State management - keep track of the input row being edited
let inputRow = {};
let gridApi;

// Fetches and processes data from the demo API
const loadData = async () => {
  try {
    // Fetch & Parse Data
    const response = await fetch(
      'https://www.ag-grid.com/example-assets/olympic-winners.json'
    );
    const data = await response.json();

    // Take a small sample and convert date strings to Date objects
    const sampleData = data.slice(3, 6).map((item) => ({
      ...item,
      date: parseDate(item.date),
    }));

    // Set Row Data
    gridApi.setGridOption('rowData', sampleData);
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};

// Checks if a cell in the pinned row is empty
const isEmptyPinnedCell = (params) => {
  return (
    params.node.rowPinned === 'top' &&
    (params.value == null || params.value === '')
  );
};

// Custom value formatter that handles both placeholders and data display
const valueFormatter = (params) => {
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

// Called when the grid is ready - initialize API and load data
function onGridReady(params) {
  gridApi = params.api;
  loadData();
}

// Checks if all required fields in the pinned row are filled
function isInputRowComplete() {
  return columnDefs.every((colDef) => {
    const field = colDef.field;
    const value = inputRow[field];
    return value !== undefined && value !== null && value !== '';
  });
}

// Handles cell editing completion - adds new row when input is complete
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

// Show row numbers for non-pinned rows
const rowNumberOptions = {
  valueFormatter: (params) => {
    return params?.node?.rowPinned ? '' : params?.value;
  },
};

// Apply CSS Class to Pinned Cells with User Edits
const cellClassRules = {
  'pinned-cell-editing': (params) => params.node.rowPinned && params.value,
};

// Apply CSS Class to Pinned Rows
const rowClassRules = {
  'pinned-row': (params) => params.node.rowPinned,
};

// Column definitions - specify fields, editors, and renderers
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
const defaultColDef = {
  flex: 1,
  editable: true,
  valueFormatter,
  cellClassRules,
};

const gridOptions = {
  columnDefs,
  defaultColDef,
  pinnedTopRowData: [inputRow], // Pin an empty row at the top for data entry
  rowNumbers: rowNumberOptions, // Show row numbers for non-pinned rows
  rowClassRules, // Style the pinned row differently
  onGridReady, // Init API & fetch data
  onCellEditingStopped, // Listen for pinned row edits
};

// Init Grid on Page Load
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector('#myGrid');
  agGrid.createGrid(gridDiv, gridOptions);
});
