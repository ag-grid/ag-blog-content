/**
 * AG Grid Add Rows with Pinned Row Demo
 *
 * This demo shows how to implement a data entry form using AG Grid's
 * pinned row feature. Users can add new rows by filling in the top row.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { AthleteData } from './utils/types';
import {
  type ColDef,
  type CellEditingStoppedEvent,
  type ValueFormatterParams,
  ModuleRegistry,
  type CellClassParams,
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { SportRenderer } from './components/SportRenderer';
import { formatDate, parseDate } from './utils/dateUtils';
import './App.css';

// Register all AG Grid modules for enterprise features and charts
ModuleRegistry.registerModules([AllEnterpriseModule]);

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

// Show row numbers for non-pinned rows
const rowNumbersOptions = {
  valueFormatter: (params: ValueFormatterParams) => {
    return params?.node?.rowPinned ? '' : params?.value;
  },
};

// Apply CSS Class to Pinned Cells with User Edits
const cellClassRules = {
  'pinned-cell-editing': (params: CellClassParams) =>
    params?.node?.rowPinned && params.value,
};

const App: React.FC = () => {
  // Store rowData, fetched from external API
  const [rowData, setRowData] = useState<AthleteData[]>();
  // Store Data Entered Into Pinned Row Cells (Auto updated by Grid)
  const [pinnedRowData, setPinnedRowData] = useState<Partial<AthleteData>>({});
  // Store reference to Grid API for use throughout the demo
  const gridRef = useRef<AgGridReact>(null);

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
    editable: true,
    valueFormatter,
    cellClassRules,
  };

  // Load data on component mount
  useEffect(() => {
    // Fetches and processes data from the demo API
    const fetchData = async () => {
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
        setRowData(sampleData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    fetchData();
  }, []);

  // Checks if all required fields in the pinned row are filled
  const isPinnedRowComplete = () => {
    return columnDefs.every((colDef) => {
      if (!colDef.field) return false;

      const v = pinnedRowData[colDef.field!];
      return v != null && v !== '';
    });
  };

  // Handles cell editing completion - adds new row when input is complete
  const onCellEditingStopped = useCallback(
    (params: CellEditingStoppedEvent) => {
      // Only process pinned row edits
      if (params.rowPinned !== 'top') return;

      // Check all pinned row cells have a value
      if (isPinnedRowComplete()) {
        // Add the new row to the grid data
        const transaction = gridRef.current?.api.applyTransaction({
          add: [pinnedRowData],
        });

        // Reset the input row for next entry
        setPinnedRowData({});
        gridRef.current?.api.setGridOption('pinnedTopRowData', [pinnedRowData]);

        // Flash the newly added row to draw attention
        // Note: add delay to ensure transaction & updates complete
        setTimeout(() => {
          gridRef.current?.api.flashCells({
            rowNodes: transaction?.add,
          });
        }, 100);
      }
    },
    [pinnedRowData]
  );

  return (
    <div className="app">
      <div style={{ height: '100vh' }}>
        <AgGridReact<AthleteData>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pinnedTopRowData={[pinnedRowData]} // Pin an empty row at the top for data entry
          rowNumbers={rowNumbersOptions} // Show row numbers for non-pinned rows
          onCellEditingStopped={onCellEditingStopped} // Listen for pinned row edits
        />
      </div>
    </div>
  );
};

export default App;
