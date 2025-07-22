import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  type ColDef,
  type DefaultMenuItem,
  type GetContextMenuItemsParams,
  type GridApi,
  type GridReadyEvent,
  type MenuItemDef,
  ModuleRegistry,
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import type { IOlympicData, ICellSelectionBounds } from './types';

// Register all AG Grid modules for enterprise features and charts
ModuleRegistry.registerModules([AllEnterpriseModule]);

/**
 * Main application component demonstrating how to programmatically
 * add & delete rows in AG Grid with custom context menu actions
 */
const App = () => {
  // Reference to the grid component for API access
  const gridApi = useRef<GridApi>(null);

  // State to hold the grid data fetched from API
  const [rowData, setRowData] = useState<IOlympicData[]>();

  // Column definitions for the grid - memoized to prevent unnecessary re-renders
  const columnDefs = useMemo<ColDef[]>(
    () => [
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
    ],
    []
  );

  // Default column properties applied to all columns
  const defaultColDef = useMemo<ColDef>(
    () => ({
      flex: 1,
      minWidth: 100,
      editable: true,
    }),
    []
  );

  const onGridReady = useCallback(async (e: GridReadyEvent) => {
    // Set API
    gridApi.current = e.api;

    // Fetch Data
    const response = await fetch(
      'https://www.ag-grid.com/example-assets/olympic-winners.json'
    );
    const json = await response.json();
    setRowData(json);
  }, []);

  /**
   * Extracts information about the currently selected cell range or clicked row
   *
   * If a cell range is selected, returns normalized start/end indices and a row count.
   * If no range is selected, returns the index of the rowNode the user clicked on
   */
  const getCellSelectionBounds = useCallback(
    (params: GetContextMenuItemsParams): ICellSelectionBounds => {
      // Get cell ranges from the grid API
      const cellRanges = gridApi.current?.getCellRanges();

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
    },
    []
  );

  // Clear selection and focus on the first new row for immediate editing
  const startEditingCell = useCallback(
    (insertIndex: number, firstColumn: string) => {
      gridApi.current?.clearCellSelection();
      gridApi.current?.setFocusedCell(insertIndex, firstColumn);
      gridApi.current?.startEditingCell({
        rowIndex: insertIndex,
        colKey: firstColumn,
      });
    },
    []
  );

  /**
   * Adds X number of empty rows to the grid, either above or below the
   * currently selected cell range, based on the number of selected rows.
   */
  const addRows = useCallback(
    (rowCount: number, startIndex?: number, endIndex?: number) => {
      // Create empty row objects for insertion
      const newRows = Array.from({ length: rowCount }, () => ({}));

      // Determine insertion point
      const insertIndex = startIndex || endIndex || 0;

      // Insert rows at the specified index
      const result = gridApi.current?.applyTransaction({
        add: newRows,
        addIndex: insertIndex,
      });

      // If rows are added, focus on and start editing first new cell
      if (result && result?.add?.length > 0) {
        // Wait for next frame to ensure grid has processed the transaction
        requestAnimationFrame(() => {
          startEditingCell(insertIndex, columnDefs[0].field || '');
        });
      }
    },
    [columnDefs, startEditingCell]
  );

  // Deletes rows from the grid within the specified range
  const deleteRows = useCallback((startIndex: number, endIndex: number) => {
    // Collect row data within the specified range
    const rowDataToRemove = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const node = gridApi.current?.getDisplayedRowAtIndex(i);
      if (node?.data) {
        rowDataToRemove.push(node.data);
      }
    }

    // Skip removal if no valid rows found
    if (rowDataToRemove.length === 0) return;

    // Remove collected rows from the grid
    gridApi.current?.applyTransaction({ remove: rowDataToRemove });

    // Clear selection after deletion
    gridApi.current?.clearCellSelection();
  }, []);

  /**
   * Builds custom context menu items based on cell selection:
   * Adds options for Adding rows above & below current selection
   * Adds option for deleting currently selected rows
   */
  const getContextMenuItems = useCallback(
    (params: GetContextMenuItemsParams): (DefaultMenuItem | MenuItemDef)[] => {
      // Get selection bounds (either from cell range or clicked row)
      const { startIndex, endIndex, rowCount } = getCellSelectionBounds(params);

      // Create pluralized label for menu items
      const rowLabel = `${rowCount} Row${rowCount !== 1 ? 's' : ''}`;

      // Build context menu with row manipulation options
      return [
        {
          name: `Insert ${rowLabel} Above`,
          action: () => addRows(rowCount, startIndex),
          icon: '<span class="ag-icon ag-icon-plus"></span>',
        },
        {
          name: `Insert ${rowLabel} Below`,
          action: () => addRows(rowCount, endIndex + 1),
          icon: '<span class="ag-icon ag-icon-plus"></span>',
        },
        'separator',
        {
          name: `Delete ${rowLabel}`,
          action: () => deleteRows(startIndex, endIndex),
          icon: '<span class="ag-icon ag-icon-minus"></span>',
        },
        // Include default menu items (copy, paste, export, etc.)
        ...(params.defaultItems ?? []),
      ];
    },
    [addRows, deleteRows, getCellSelectionBounds]
  );

  return (
    <div style={{ height: '100vh' }}>
      <AgGridReact<IOlympicData>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef} // Default column properties
        onGridReady={onGridReady} // Fetch data & set API ref
        getContextMenuItems={getContextMenuItems} // Custom context menu provider
        editType="fullRow" // Enable full row editing mode
        cellSelection // Enable cell selection feature
        rowNumbers
      />
    </div>
  );
};

export default App;
