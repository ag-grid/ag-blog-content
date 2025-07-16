let rowData = [];
let inputRow = {};
let gridApi;

function setRowData(newData) {
  rowData = newData;
  console.log(newData);
  gridApi.setGridOption('rowData', newData);
}

function setInputRow(newData) {
  inputRow = newData;
  gridApi.setGridOption('pinnedTopRowData', [inputRow]);
}

const valueFormatter = (params) => {
  console.log(`Formatting value for ${params.colDef.field}`);
  if (isEmptyPinnedCell(params)) {
    return createPinnedCellPlaceholder(params);
  }

  // Format dates as DD/MM/YYYY
  if (params.colDef.field === 'date' && params.value instanceof Date) {
    const day = params.value.getDate().toString().padStart(2, '0');
    const month = (params.value.getMonth() + 1).toString().padStart(2, '0');
    const year = params.value.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return params.value;
};

// column definitions
const columnDefs = [
  { field: 'athlete', valueFormatter: valueFormatter },
  {
    field: 'sport',
    cellRenderer: SportRenderer,
    cellEditor: 'agRichSelectCellEditor',
    cellEditorParams: {
      values: ['Swimming', 'Gymnastics', 'Cycling', 'Ski Jumping'],
      cellRenderer: SportRenderer,
    },
    valueFormatter: valueFormatter,
  },
  {
    field: 'date',
    cellEditor: 'agDateCellEditor',
    valueFormatter: valueFormatter,
  },
  {
    field: 'age',
    valueFormatter: valueFormatter,
  },
];

const defaultColDef = {
  flex: 1,
  editable: true,
};

function isEmptyPinnedCell({ node, value }) {
  return (
    (node.rowPinned === 'top' && value == null) ||
    (node.rowPinned === 'top' && value == '')
  );
}

function createPinnedCellPlaceholder({ colDef }) {
  return colDef.field[0].toUpperCase() + colDef.field.slice(1) + '...';
}

function isPinnedRowDataCompleted(params) {
  if (params.rowPinned !== 'top') return;
  return columnDefs.every((def) => inputRow[def.field]);
}

const gridOptions = {
  columnDefs,
  defaultColDef,
  pinnedTopRowData: [inputRow],
  rowNumbers: true,
  getRowStyle: ({ node }) =>
    node.rowPinned ? { 'font-weight': 'bold', 'font-style': 'italic' } : 0,
  onCellEditingStopped: (params) => {
    if (isPinnedRowDataCompleted(params)) {
      // save data
      setRowData([...rowData, inputRow]);
      //reset pinned row
      setInputRow({});
    }
  },
  onGridReady: (params) => {
    gridApi = params.api;
    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
      .then((res) => res.json())
      .then((data) => data.slice(3, 6))
      .then((trimmedData) =>
        trimmedData.map((d) => {
          // Convert DD/MM/YYYY to Date object
          const [day, month, year] = d.date.split('/');
          return {
            ...d,
            date: new Date(year, month - 1, day), // month is 0-indexed in JavaScript
          };
        })
      )
      .then((parsedDateData) => {
        rowData = parsedDateData;
        params.api.setGridOption('rowData', parsedDateData);
      })
      .catch(console.error);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const eGridDiv = document.querySelector('#myGrid');
  agGrid.createGrid(eGridDiv, gridOptions);
});
