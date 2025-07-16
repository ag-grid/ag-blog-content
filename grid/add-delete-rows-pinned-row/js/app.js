const demoDataUrl =
  'https://www.ag-grid.com/example-assets/olympic-winners.json';
let rowData = [];
let inputRow = {};
let gridApi;

function setRowData(newData) {
  rowData = newData;
  console.log(newData);
  // gridApi.setGridOption('rowData', rowData);
  const transaction = gridApi.applyTransaction({
    add: newData,
    addIndex: 0,
  });

  console.log(transaction);
}

function setInputRow(newData) {
  inputRow = newData;
  gridApi.setGridOption('pinnedTopRowData', [inputRow]);
}

function createPinnedCellPlaceholder({ colDef }) {
  return colDef.field[0].toUpperCase() + colDef.field.slice(1) + '...';
}

function formatDate(date) {
  if (!(date instanceof Date)) return date;
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function isEmptyPinnedCell({ node, value }) {
  return node.rowPinned === 'top' && (value == null || value === '');
}

function valueFormatter(params) {
  if (isEmptyPinnedCell(params)) {
    return createPinnedCellPlaceholder(params);
  }

  if (params.colDef.field === 'date') {
    return formatDate(params.value);
  }

  return params.value;
}

const columnDefs = [
  { field: 'athlete' },
  {
    field: 'sport',
    cellRenderer: SportRenderer,
    cellEditor: 'agRichSelectCellEditor',
    cellEditorParams: {
      values: ['Swimming', 'Gymnastics', 'Cycling', 'Ski Jumping'],
      cellRenderer: SportRenderer,
    },
  },
  {
    field: 'date',
    cellEditor: 'agDateCellEditor',
    valueFormatter,
  },
  { field: 'age', valueFormatter },
];

const defaultColDef = {
  flex: 1,
  editable: true,
  valueFormatter,
};

const fetchData = async () => {
  try {
    const response = await fetch(demoDataUrl);
    const data = await response.json();
    const trimmedData = data.slice(3, 6);
    const parsedData = parseDateStrings(trimmedData);
    rowData = parsedData;
    gridApi.setGridOption('rowData', rowData);
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};

const parseDateStrings = (data) => {
  return data.map((d) => {
    const [day, month, year] = d.date.split('/');
    return {
      ...d,
      date: new Date(year, month - 1, day),
    };
  });
};

const onGridReady = (params) => {
  gridApi = params.api;
  fetchData();
};

function isPinnedRowDataCompleted() {
  return columnDefs.every((def) => inputRow[def.field]);
}

const onCellEditingStopped = (params) => {
  if (params.rowPinned === 'top' && isPinnedRowDataCompleted()) {
    setRowData(inputRow);
    setInputRow({});
  }
};

const rowClassRules = {
  'pinned-row': (params) => params.node.rowPinned,
};

const gridOptions = {
  columnDefs,
  defaultColDef,
  pinnedTopRowData: [inputRow],
  rowNumbers: true,
  rowClassRules,
  onCellEditingStopped,
  onGridReady,
};

document.addEventListener('DOMContentLoaded', () => {
  const eGridDiv = document.querySelector('#myGrid');
  agGrid.createGrid(eGridDiv, gridOptions);
});
