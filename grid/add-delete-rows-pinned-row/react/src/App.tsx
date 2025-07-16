import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  type ColDef,
  type CellEditingStoppedEvent,
  type ValueFormatterParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { SportRenderer } from './components/SportRenderer';
import { formatDate, parseDate } from './utils/dateUtils';
import './App.css';

// Register all AG Grid modules for enterprise features and charts
ModuleRegistry.registerModules([AllEnterpriseModule]);

interface AthleteData {
  athlete: string;
  sport: string;
  date: Date;
  age: number;
}

const App: React.FC = () => {
  const [rowData, setRowData] = useState<AthleteData[]>([]);
  const [inputRow, setInputRow] = useState<Partial<AthleteData>>({});
  const gridRef = useRef<AgGridReact>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
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
  }, []);

  const isEmptyPinnedCell = useCallback((params: ValueFormatterParams) => {
    return (
      params.node.rowPinned === 'top' &&
      (params.value == null || params.value === '')
    );
  }, []);

  const valueFormatter = useCallback(
    (params: ValueFormatterParams) => {
      if (isEmptyPinnedCell(params)) {
        return `${params.colDef.headerName}...`;
      }

      if (params.colDef.field === 'date') {
        return formatDate(params.value);
      }

      return params.value;
    },
    [isEmptyPinnedCell]
  );

  const onCellEditingStopped = useCallback(
    (params: CellEditingStoppedEvent) => {
      if (params.rowPinned !== 'top') return;

      const field = params.colDef.field as keyof AthleteData;
      const updatedInputRow = { ...inputRow, [field]: params.newValue };
      setInputRow(updatedInputRow);

      // Check if all fields are filled
      const requiredFields: (keyof AthleteData)[] = [
        'athlete',
        'sport',
        'date',
        'age',
      ];
      const isComplete = requiredFields.every((fieldName) => {
        const value = updatedInputRow[fieldName];
        return value !== undefined && value !== null && value !== '';
      });

      if (isComplete) {
        // Add new row to data
        const newRow = updatedInputRow as AthleteData;
        setRowData((prevData: AthleteData[]) => [...prevData, newRow]);

        // Flash the newly added row
        const api = gridRef.current?.api;
        if (api) {
          setTimeout(() => {
            api.forEachNode((node: any) => {
              if (node.data === newRow) {
                api.flashCells({ rowNodes: [node] });
              }
            });
          }, 100);
        }

        // Reset input row
        setInputRow({});
      }
    },
    [inputRow]
  );

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
      'pinned-cell-editing': (params: any) =>
        params.node.rowPinned && params.value,
    },
  };

  const rowNumbersFormatter = useCallback((params: ValueFormatterParams) => {
    return params?.node?.rowPinned ? '' : params?.value;
  }, []);

  return (
    <div className="app">
      <div style={{ height: '100vh' }}>
        <AgGridReact<AthleteData>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pinnedTopRowData={[inputRow]}
          rowNumbers={{
            valueFormatter: rowNumbersFormatter,
          }}
          onCellEditingStopped={onCellEditingStopped}
        />
      </div>
    </div>
  );
};

export default App;
