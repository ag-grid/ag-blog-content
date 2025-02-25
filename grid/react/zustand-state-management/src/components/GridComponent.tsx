import { useState, useMemo, useRef, useCallback } from "react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);
import {
  CellSelectionModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  PivotModule,
  SetFilterModule,
} from "ag-grid-enterprise";

ModuleRegistry.registerModules([
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
  CellSelectionModule,
  PivotModule,
  AllCommunityModule
]);

function GridComponent() {
  const gridRef = useRef(null);
  const [rowData, setRowData] = useState();
  
  const [columnDefs, setColumnDefs] = useState([
    { field: "athlete", minWidth: 150 },
    { field: "age", maxWidth: 90 },
    { field: "country", minWidth: 150 },
    { field: "year", maxWidth: 90 },
    { field: "date", minWidth: 150 },
    { field: "sport", minWidth: 150 },
    { field: "gold" },
    { field: "silver" },
    { field: "bronze" },
    { field: "total" },
  ]);
    
  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      minWidth: 100,
      filter: true,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: true,
    };
  }, []);
  
  const rowSelection = useMemo(
    () => ({
      mode: "multiRow",
    }),
    [],
  );
  const [initialState, setInitialState] = useState();
  const [currentState, setCurrentState] = useState();

  const onGridReady = useCallback((params: any) => {
    fetch("https://www.ag-grid.com/example-assets/olympic-winners.json")
      .then((resp) => resp.json())
      .then((data) => setRowData(data));
  }, []);

  const onGridPreDestroyed = useCallback((params: any) => {
    const { state } = params;
    console.log("Grid state on destroy (can be persisted)", state);
    setInitialState(state);
  }, []);

  const onStateUpdated = useCallback((params: any) => {
    console.log("State updated", params.state);
    setCurrentState(params.state);
  }, []);

    return (
        <div style={{ width: "100%", height: '90vh' }}>
            <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        sideBar={true}
        pagination={true}
        rowSelection={rowSelection as any}
        suppressColumnMoveAnimation={true}
        initialState={initialState}
        onGridReady={onGridReady}
        onGridPreDestroyed={onGridPreDestroyed}
        onStateUpdated={onStateUpdated}
      />
        </div>
    );
}

export default GridComponent