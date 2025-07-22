(function () {
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
  };

  /**
   * Extracts information about the currently selected cell range or clicked row
   *
   * If a cell range is selected, returns normalized start/end indices and a row count.
   * If no range is selected, returns the index of the rowNode the user clicked on
   */
  function getCellSelectionBounds(api, params) {
    // Get cell ranges from the grid API
    const cellRanges = api.getCellRanges();

    // Fallback to clicked row if no cell range is selected
    if (!cellRanges || !cellRanges[0]?.startRow || !cellRanges[0]?.endRow) {
      const rowIndex = params.node?.rowIndex || 0;
      return { startIndex: rowIndex, endIndex: rowIndex, rowCount: 1 };
    }

    // Extract row indices from the first cell range
    const cellRangeStartRowIndex = cellRanges[0].startRow.rowIndex;
    const cellRangeEndRowIndex = cellRanges[0].endRow.rowIndex;

    // Calculate total rows in selection (inclusive)
    const rowCount =
      Math.abs(cellRangeEndRowIndex - cellRangeStartRowIndex) + 1;

    // Normalize indices since selection can be made in either direction
    const startIndex = Math.min(cellRangeStartRowIndex, cellRangeEndRowIndex);
    const endIndex = Math.max(cellRangeStartRowIndex, cellRangeEndRowIndex);

    // Return normalized selection bounds
    return { startIndex, endIndex, rowCount };
  }

  // Clear selection and focus on the first new row for immediate editing
  function startEditingCell(api, insertIndex, firstColumn) {
    api.clearCellSelection();
    api.setFocusedCell(insertIndex, firstColumn);
    api.startEditingCell({
      rowIndex: insertIndex,
      colKey: firstColumn,
    });
  }

  /**
   * Adds X number of empty rows to the grid, either above or below the
   * currently selected cell range, based on the number of selected rows.
   */
  function addRows(api, rowCount, startIndex, endIndex) {
    // Create empty row objects for insertion
    const newRows = Array.from({ length: rowCount }, () => ({}));

    // Determine insertion point
    const insertIndex = startIndex || endIndex || 0;

    // Insert rows at the specified index
    const result = api.applyTransaction({
      add: newRows,
      addIndex: insertIndex,
    });

    // If rows are added, focus on and start editing first new cell
    if (result && result?.add?.length > 0) {
      // Wait for next frame to ensure grid has processed the transaction
      requestAnimationFrame(() => {
        startEditingCell(api, insertIndex, columnDefs[0].field || '');
      });
    }
  }

  // Deletes rows from the grid within the specified range
  function deleteRows(api, startIndex, endIndex) {
    // Collect row data within the specified range
    const rowDataToRemove = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const node = api.getDisplayedRowAtIndex(i);
      if (node?.data) {
        rowDataToRemove.push(node.data);
      }
    }

    // Skip removal if no valid rows found
    if (rowDataToRemove.length === 0) return;

    // Remove collected rows from the grid
    api.applyTransaction({ remove: rowDataToRemove });

    // Clear selection after deletion
    api.clearCellSelection();
  }

  /**
   * Builds custom context menu items based on cell selection:
   * Adds options for Adding rows above & below current selection
   * Adds option for deleting currently selected rows
   */
  function getContextMenuItems(params) {
    const api = params.api;
    // Get selection bounds (either from cell range or clicked row)
    const { startIndex, endIndex, rowCount } = getCellSelectionBounds(
      api,
      params
    );

    // Create pluralized label for menu items
    const rowLabel = `${rowCount} Row${rowCount !== 1 ? 's' : ''}`;

    // Build context menu with row manipulation options
    return [
      {
        name: `Insert ${rowLabel} Above`,
        action: () => addRows(api, rowCount, startIndex),
        icon: '<span class="ag-icon ag-icon-plus"></span>',
      },
      {
        name: `Insert ${rowLabel} Below`,
        action: () => addRows(api, rowCount, endIndex + 1),
        icon: '<span class="ag-icon ag-icon-plus"></span>',
      },
      'separator',
      {
        name: `Delete ${rowLabel}`,
        action: () => deleteRows(api, startIndex, endIndex),
        icon: '<span class="ag-icon ag-icon-minus"></span>',
      },
      // Include default menu items (copy, paste, export, etc.)
      ...(params.defaultItems || []),
    ];
  }

  const gridOptions = {
    columnDefs,
    defaultColDef,
    getContextMenuItems,
    editType: 'fullRow',
    cellSelection: true,
    rowNumbers: true,
    onGridReady: async (params) => {
      // Fetch Data
      const response = await fetch(
        'https://www.ag-grid.com/example-assets/olympic-winners.json'
      );
      const json = await response.json();
      params.api.setGridOption('rowData', json);
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const eGridDiv = document.querySelector('#myGrid');
    agGrid.createGrid(eGridDiv, gridOptions);
  });
})();
