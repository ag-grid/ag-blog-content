(function () {
  // For the CDN version, we use the global agGrid namespace directly

  // column definitions
  const columnDefs = [
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

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    editable: true,
    resizable: true,
  };

  function getCellSelectionBounds(api) {
    try {
      const ranges = api.getCellRanges();
      if (!ranges || ranges.length === 0) throw 'No cells selected!';
      const { startRow, endRow } = ranges[0];
      if (!startRow || !endRow) throw 'Could not find selected Cell Range';

      const cellRangeStartRowIndex = startRow.rowIndex;
      const cellRangeEndRowIndex = endRow.rowIndex;
      const rowCount =
        Math.abs(cellRangeEndRowIndex - cellRangeStartRowIndex) + 1;

      return {
        cellRangeStartRowIndex,
        cellRangeEndRowIndex,
        rowCount,
        start: Math.min(cellRangeStartRowIndex, cellRangeEndRowIndex),
        end: Math.max(cellRangeStartRowIndex, cellRangeEndRowIndex),
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  function addRows(api, position, bounds) {
    try {
      const newRows = Array(bounds.rowCount)
        .fill(null)
        .map(() => ({}));
      const insertIndex =
        position === 'above'
          ? Math.min(bounds.cellRangeStartRowIndex, bounds.cellRangeEndRowIndex)
          : Math.max(
              bounds.cellRangeStartRowIndex,
              bounds.cellRangeEndRowIndex
            ) + 1;

      const res = api.applyTransaction({ add: newRows, addIndex: insertIndex });

      if (res && res.add && res.add.length > 0) {
        setTimeout(() => {
          api.clearCellSelection();
          const colKey = columnDefs[0].field;
          api.setFocusedCell(insertIndex, colKey);
          api.startEditingCell({ rowIndex: insertIndex, colKey });
        }, 100);
      }
    } catch (error) {
      console.error(`Error adding rows ${position}:`, error);
    }
  }

  function deleteRows(api, bounds) {
    try {
      const start = Math.min(
        bounds.cellRangeStartRowIndex,
        bounds.cellRangeEndRowIndex
      );
      const end = Math.max(
        bounds.cellRangeStartRowIndex,
        bounds.cellRangeEndRowIndex
      );

      const toRemove = [];
      for (let i = start; i <= end; i++) {
        const node = api.getDisplayedRowAtIndex(i);
        if (node && node.data) toRemove.push(node.data);
      }

      if (toRemove.length === 0) return;

      api.applyTransaction({ remove: toRemove });
      api.clearCellSelection();
    } catch (error) {
      console.error('Error deleting rows:', error);
    }
  }

  function getContextMenuItems(params) {
    const api = params.api;
    const cellSelectionBounds = getCellSelectionBounds(api);

    if (cellSelectionBounds) {
      const rowCount = cellSelectionBounds.rowCount;
      const rowLabel = `${rowCount} Row${rowCount !== 1 ? 's' : ''}`;

      return [
        {
          name: `Insert ${rowLabel} Above`,
          action: () => addRows(api, 'above', cellSelectionBounds),
          icon: '<span class="ag-icon ag-icon-plus"></span>',
        },
        {
          name: `Insert ${rowLabel} Below`,
          action: () => addRows(api, 'below', cellSelectionBounds),
          icon: '<span class="ag-icon ag-icon-plus"></span>',
        },
        'separator',
        {
          name: `Delete ${rowLabel}`,
          action: () => deleteRows(api, cellSelectionBounds),
          icon: '<span class="ag-icon ag-icon-minus"></span>',
        },
        ...(params.defaultItems || []),
      ];
    }

    return params.defaultItems || [];
  }

  const gridOptions = {
    columnDefs,
    defaultColDef,
    getContextMenuItems,
    editType: 'fullRow',
    cellSelection: true,
    rowNumbers: true,
    onGridReady: (params) => {
      fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((res) => res.json())
        .then((data) => params.api.setGridOption('rowData', data))
        .catch(console.error);
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const eGridDiv = document.querySelector('#myGrid');
    agGrid.createGrid(eGridDiv, gridOptions);
  });
})();
