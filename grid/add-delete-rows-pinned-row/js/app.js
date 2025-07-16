let rowData = [];
let inputRow = {};

function setRowData(newData) {
  rowData = newData;
  gridOptions.api.setRowData(rowData);
}

function setInputRow(newData) {
  inputRow = newData;
  gridOptions.api.setPinnedTopRowData([inputRow]);
}

// column definitions
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
    cellDataType: 'date',
    valueFormatter: (params) =>
      isEmptyPinnedCell(params)
        ? createPinnedCellPlaceholder(params)
        : params.value
        ? params.value.toLocaleDateString()
        : '',
  },
  {
    field: 'age',
    cellDataType: 'number',
    valueFormatter: (params) =>
      isEmptyPinnedCell(params)
        ? createPinnedCellPlaceholder(params)
        : params.value,
  },
];

const defaultColDef = {
  flex: 1,
  editable: true,
  valueFormatter: (params) =>
    isEmptyPinnedCell(params) ? createPinnedCellPlaceholder(params) : undefined,
};

const valueFormatter = (p) => {
  console.log(`Formatting value for ${p.node}`);
};

function isEmptyPinnedCell({ node, value }) {
  console.log(`Checking if ${node} with value ${value} is empty`);
  return (
    (node.rowPinned === 'top' && value == null) ||
    (node.rowPinned === 'top' && value == '')
  );
}

function createPinnedCellPlaceholder({ colDef }) {
  console.log(`Creating Placeholder for ${colDef.field}`);
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
      .then((parsedDateData) =>
        params.api.setGridOption('rowData', parsedDateData)
      )
      .catch(console.error);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const eGridDiv = document.querySelector('#myGrid');
  agGrid.createGrid(eGridDiv, gridOptions);
});
