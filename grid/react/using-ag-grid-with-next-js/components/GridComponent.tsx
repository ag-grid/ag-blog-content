// components/GridComponent.tsx
'use client';

import { AgGridReact } from "ag-grid-react";
import { useCallback, useState } from "react";
import { ColDef, GridReadyEvent } from "ag-grid-community";
import { IServerSideDatasource, IServerSideGetRowsParams, ModuleRegistry, IServerSideGetRowsRequest } from "@ag-grid-community/core";
import { ServerSideRowModelModule } from "@ag-grid-enterprise/server-side-row-model";
import "ag-grid-community/styles/ag-grid.css"; 
import "ag-grid-community/styles/ag-theme-quartz.css"; 

import 'ag-grid-enterprise'; // Import the Enterprise features
// import { LicenseManager } from "ag-grid-enterprise";

// Set your license key here
// LicenseManager.setLicenseKey(process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY || "");

ModuleRegistry.registerModules([ServerSideRowModelModule]);

// Create a datasource that uses the /api/fakeServer endpoint
const getServerSideDatasource = (): IServerSideDatasource => {
  return {
    async getRows(params: IServerSideGetRowsParams) {
      console.log("[Datasource] - rows requested by grid: ", params.request);
      
      try {
        const response = await fetch('/api/fake-server', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params.request as IServerSideGetRowsRequest),
        });
        
        if (!response.ok) {
          console.error("Failed to fetch data from server");
          params.fail();
          return;
        }

        const data = await response.json();
        console.log("[Datasource] - rows returned from server: ", data);
        
        if (data.success) {
          params.success({
            rowData: data.rows,
            rowCount: data.lastRow,
          });
        } else {
          params.fail();
        }
      } catch (error) {
        console.error("Error fetching data: ", error);
        params.fail();
      }
    }
  };
};

const GridComponent = () => {
    const [columnDefs] = useState<ColDef[]>([
        { 
          field: "athlete", 
          filter: "agTextColumnFilter",
          editable: true,
          onCellValueChanged: (event) => {
            console.log("Cell changed:", event.data);
          }
        },
        { field: "age", filter: "agNumberColumnFilter" },
        { field: "date", filter: "agDateColumnFilter" },
        { field: "country", sortable: false},
        { field: "sport"},
        { field: "gold"},
        { field: "silver"},
        { field: "bronze"},
        { field: "total"},
    ]);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        console.log("Grid ready event received");
        const datasource = getServerSideDatasource();
        // Register the datasource with the grid
        params.api!.setGridOption("serverSideDatasource", datasource as any);
    }, []);

    return (
        <div
          className="ag-theme-quartz-dark"
          style={{ height: 750 }}
        >
          <AgGridReact
            columnDefs={columnDefs}
            enableCharts={true}
            rowSelection="multiple"
            cellSelection={true}
            rowModelType={"serverSide"}
            onGridReady={onGridReady}
          />
        </div>
    );
};

export default GridComponent;
