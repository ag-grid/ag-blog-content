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

// Validate pinned cell values
const isEmptyPinnedCell = (params: ValueFormatterParams) => {
  return (
    params.node?.rowPinned === 'top' &&
    (params.value == null || params.value === '')
  );
};

// Format pinned row placeholders
const valueFormatter = (params: ValueFormatterParams) => {
  if (isEmptyPinnedCell(params)) {
    return `${params.colDef.headerName}...`;
  }

  if (params.colDef.field === 'date') {
    return formatDate(params.value);
  }

  return params.value;
};

// Hide row number for pinned rows
const rowNumbersOptions = {
  valueFormatter: (params: ValueFormatterParams) => {
    return params?.node?.rowPinned ? '' : params?.value;
  },
};

const cellClassRules = {
  'pinned-cell-editing': (params: CellClassParams) =>
    params?.node?.rowPinned && params.value,
};

const App: React.FC = () => {
  // Store rowData, fetched from external API
  const [rowData, setRowData] = useState<AthleteData[]>();
  // Store Pinned Row Data, which is automatically updated by the Grid
  const [pinnedRowData, setPinnedRowData] = useState<Partial<AthleteData>>({});
  // Store reference to the grid, to access the API
  const gridRef = useRef<AgGridReact>(null);

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
      cellEditor: 'agDateCellEditor',
      valueFormatter,
    },
    {
      field: 'age',
      headerName: 'Age',
      valueFormatter,
    },
  ];

  const defaultColDef: ColDef = {
    flex: 1,
    editable: true,
    valueFormatter,
    cellClassRules,
  };

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'https://www.ag-grid.com/example-assets/olympic-winners.json'
        );
        const data = await response.json();

        const sampleData = data.slice(3, 6).map((item: any) => ({
          ...item,
          date: parseDate(item.date),
        }));

        setRowData(sampleData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    fetchData();
  }, []);

  // Check all pinned row cells have a value
  const isPinnedRowComplete = () => {
    return columnDefs.every((colDef) => {
      // Ignore edits if pinned row does not contain all columns
      if (!colDef.field) return false;

      // Ignore edits if pinned row cell value is undefined
      const v = pinnedRowData[colDef.field!];
      return v != null && v !== '';
    });
  };

  const onCellEditingStopped = useCallback(
    (params: CellEditingStoppedEvent) => {
      // Only handle pinned row edits
      if (params.rowPinned !== 'top') return;

      // Check all pinned row cells have a value
      if (isPinnedRowComplete()) {
        // Add new row to data
        const transaction = gridRef.current?.api.applyTransaction({
          add: [pinnedRowData],
        });

        // Reset input row
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
          pinnedTopRowData={[pinnedRowData]}
          rowNumbers={rowNumbersOptions}
          onCellEditingStopped={onCellEditingStopped}
        />
      </div>
    </div>
  );
};

export default App;
