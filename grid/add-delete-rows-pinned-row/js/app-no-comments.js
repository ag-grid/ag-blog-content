let inputRow = {};
let gridApi;

const formatDate = (date) => {
  if (!(date instanceof Date)) return date;
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDate = (dateString) => {
  const [day, month, year] = dateString.split('/');
  return new Date(year, month - 1, day);
};

const isEmptyPinnedCell = (params) =>
  params.node.rowPinned === 'top' &&
  (params.value == null || params.value === '');

const loadData = async () => {
  try {
    const response = await fetch(
      'https://www.ag-grid.com/example-assets/olympic-winners.json'
    );
    const data = await response.json();
    const sampleData = data
      .slice(3, 6)
      .map((item) => ({ ...item, date: parseDate(item.date) }));
    gridApi.setGridOption('rowData', sampleData);
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};

const valueFormatter = (params) => {
  if (isEmptyPinnedCell(params)) return `${params.colDef.headerName}...`;
  if (params.colDef.field === 'date') return formatDate(params.value);
  return params.value;
};

const columnDefs = [
  { field: 'athlete', headerName: 'Athlete' },
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
  { field: 'age', headerName: 'Age', valueFormatter },
];

const defaultColDef = {
  flex: 1,
  editable: true,
  valueFormatter,
  cellClassRules: {
    'pinned-cell-editing': (params) => params.node.rowPinned && params.value,
  },
  enableCellChangeFlash: true,
};

const onGridReady = (params) => {
  gridApi = params.api;
  loadData();
};

const isInputRowComplete = () =>
  columnDefs.every((colDef) => {
    const value = inputRow[colDef.field];
    return value !== undefined && value !== null && value !== '';
  });

const onCellEditingStopped = (params) => {
  if (params.rowPinned !== 'top') return;

  inputRow[params.colDef.field] = params.newValue;

  if (isInputRowComplete()) {
    const transaction = gridApi.applyTransaction({ add: [inputRow] });
    gridApi.flashCells({ rowNodes: transaction.add });
    inputRow = {};
    gridApi.setGridOption('pinnedTopRowData', [inputRow]);
  }
};

const gridOptions = {
  columnDefs,
  defaultColDef,
  pinnedTopRowData: [inputRow],
  rowNumbers: {
    valueFormatter: (params) => (params?.node?.rowPinned ? '' : params?.value),
  },
  rowClassRules: { 'pinned-row': (params) => params.node.rowPinned },
  onGridReady,
  onCellEditingStopped,
};

document.addEventListener('DOMContentLoaded', () => {
  agGrid.createGrid(document.querySelector('#myGrid'), gridOptions);
});
