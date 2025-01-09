// components/GridComponent.tsx
'use client';

import { AgGridReact } from 'ag-grid-react';
import { useCallback, useState } from 'react';
import type {
  ColDef,
  GridReadyEvent,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
} from 'ag-grid-community';
import {
  AllCommunityModule,
  InfiniteRowModelModule,
  ModuleRegistry,
} from 'ag-grid-community';
import 'ag-grid-enterprise';
import {
  ContextMenuModule,
  IntegratedChartsModule,
  LicenseManager,
  ServerSideRowModelModule,
} from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

// Set your license key here
LicenseManager.setLicenseKey(process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY || '');

ModuleRegistry.registerModules([
  AllCommunityModule,
  ContextMenuModule,
  ServerSideRowModelModule,
  InfiniteRowModelModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
]);

const getServerSideDatasource = (): IServerSideDatasource => {
  return {
    async getRows(params: IServerSideGetRowsParams) {
      console.log('[Datasource] - rows requested by grid: ', params.request);

      try {
        const response = await fetch('/api/mock-server', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params.request as IServerSideGetRowsRequest),
        });

        if (!response.ok) {
          console.error('Failed to fetch data from server');
          params.fail();
          return;
        }

        const data = await response.json();
        console.log('[Datasource] - rows returned from server: ', data);

        if (data.success) {
          params.success({
            rowData: data.rows,
            rowCount: data.lastRow,
          });
        } else {
          params.fail();
        }
      } catch (error) {
        console.error('Error fetching data: ', error);
        params.fail();
      }
    },
  };
};

const GridComponentSSRM = () => {
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

  const [rowSelection, setRowSelection] = useState({ mode: 'multiple'});

  const onGridReady = useCallback((params: GridReadyEvent) => {
    console.log('Grid ready event received');
    const datasource = getServerSideDatasource();
    // Register the datasource with the grid
    params.api!.setGridOption('serverSideDatasource', datasource as any);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <AgGridReact
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        enableCharts={true} // Enable the Charting features
        cellSelection={true}
        rowSelection={{ ...rowSelection}}
        rowModelType={'serverSide'}
        cacheBlockSize={50}
        onGridReady={onGridReady}
      />
    </div>
  );
};

export default GridComponentSSRM;
