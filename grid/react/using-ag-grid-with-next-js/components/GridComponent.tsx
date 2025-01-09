// components/GridComponent.tsx
'use client';

import { AgGridReact } from 'ag-grid-react';
import { useEffect, useMemo, useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { ContextMenuModule, IntegratedChartsModule } from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

// Set your license key here
// LicenseManager.setLicenseKey(process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY || '');

ModuleRegistry.registerModules([
  AllCommunityModule,
  ContextMenuModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
]);

const GridComponent = () => {
  const [rowData, setRowData] = useState<any[]>([]);

  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    {
      field: 'athlete',
      filter: 'agTextColumnFilter',
      editable: true,
      onCellValueChanged: (event) => {
        console.log(event.data);
        // Handle the cell value change event
        // Here, you can update the data in the server or perform any other action
      },
    },
    { field: 'age', filter: true },
    { field: 'date', resizable: false, filter: 'agDateColumnFilter' },
    { field: 'country', sortable: false },
    { field: 'sport' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
  ]);

  const [defaultColDef, setDefaultColDef] = useState({
    resizable: true,
  });

  useEffect(() => {
    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json') // Fetch data from server
      .then((result) => result.json()) // Convert to JSON
      .then((rowData) => setRowData(rowData)); // Update state of `rowData`
  }, []);

  const pagination = useMemo(() => {
    return {
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 20, 30, 40, 50],
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        enableCharts={true} // Enable the Charting features
        cellSelection={true}
        rowSelection={{
          mode: 'multiRow',
        }}
      />
    </div>
  );
};

export default GridComponent;
