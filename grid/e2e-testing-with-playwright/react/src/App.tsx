import { useState, useEffect, useMemo } from 'react';
import { AllCommunityModule, ModuleRegistry, ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

export type ICar = {
  make: string;
  model: string;
  price: number;
  electric: boolean;
};

ModuleRegistry.registerModules([AllCommunityModule]);

function App() {
  const [rowData, setRowData] = useState<ICar[] | null>(null);

  useEffect(() => {
    // Simulate an asynchronous data fetch (e.g., from an API)
    const timer = setTimeout(() => {
      setRowData([
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false },
        { make: 'Mercedes', model: 'EQA', price: 48890, electric: true },
        { make: 'Fiat', model: '500', price: 15774, electric: false },
        { make: 'Nissan', model: 'Juke', price: 20675, electric: false },
      ]);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState<ColDef<ICar>[]>([
    { field: 'make', editable: true, filter: true },
    { field: 'model' },
    { field: 'price', editable: true },
    { field: 'electric' },
  ]);

  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
    };
  }, []);

  // Container: Defines the grid's theme & dimensions.
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
      />
    </div>
  );
}

export default App;
