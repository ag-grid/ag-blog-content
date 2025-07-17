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

const App: React.FC = () => {
  const [rowData, setRowData] = useState<AthleteData[]>([]);
  const [inputRow, setInputRow] = useState<Partial<AthleteData>>({});
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
    cellClassRules: {
      'pinned-cell-editing': (params: CellClassParams) =>
        params?.node?.rowPinned && params.value,
    },
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
  const isInputRowComplete = () => {
    return columnDefs.every((colDef) => {
      const field = colDef.field;
      if (field) {
        const value = inputRow[field];
        return value !== undefined && value !== null && value !== '';
      }
      return false;
    });
  };

  const onCellEditingStopped = useCallback(
    (params: CellEditingStoppedEvent) => {
      // Only handle pinned row edits
      if (params.rowPinned !== 'top') return;

      // Check all pinned row cells have a value
      if (isInputRowComplete()) {
        // Add new row to data
        const transaction = gridRef.current?.api.applyTransaction({
          add: [inputRow],
        });

        // Reset input row
        setInputRow({});
        gridRef.current?.api.setGridOption('pinnedTopRowData', [inputRow]);

        // Flash the newly added row to draw attention
        // Note: add delay to ensure transaction & updates complete
        setTimeout(() => {
          gridRef.current?.api.flashCells({
            rowNodes: transaction?.add,
          });
        }, 100);
      }
    },
    [inputRow]
  );

  return (
    <div className="app">
      <div style={{ height: '100vh' }}>
        <AgGridReact<AthleteData>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pinnedTopRowData={[inputRow]}
          rowNumbers={rowNumbersOptions}
          onCellEditingStopped={onCellEditingStopped}
        />
      </div>
    </div>
  );
};

export default App;
