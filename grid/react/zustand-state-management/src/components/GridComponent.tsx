import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import useStore from "../store/store";

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
  const gridRef = useRef(null) as any;
  const [rowData, setRowData] = useState();

	const { gridState, setGridState } = useStore();
  
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

  const onGridReady = useCallback((params: any) => {
    fetch("https://www.ag-grid.com/example-assets/olympic-winners.json")
      .then((resp) => resp.json())
      .then((data) => setRowData(data));
    
    // Apply saved state from Zustand store
    if (gridState && gridRef.current && gridRef.current.api) {
      console.log("Applying saved grid state:", gridState);
      
      // Apply column state (includes width, visibility, order)
      if (gridState.columnState) {
        gridRef.current.api.applyColumnState({
          state: gridState.columnState,
          applyOrder: true,
        });
      }
      
      // Apply filter model if exists
      if (gridState.filterModel) {
        gridRef.current.api.setFilterModel(gridState.filterModel);
      }
      
      // Apply sort model if exists
      if (gridState.sortModel) {
        gridRef.current.api.setSortModel(gridState.sortModel);
      }
      
      // Apply row group model if exists
      if (gridState.rowGroupColumnsState) {
        const rowGroupCols = gridState.rowGroupColumnsState.map((item: any) => item.colId);
        gridRef.current.columnApi.setRowGroupColumns(rowGroupCols);
      }
      
      // Apply pivot model if exists
      if (gridState.pivotColumnsState) {
        const pivotCols = gridState.pivotColumnsState.map((item: any) => item.colId);
        gridRef.current.columnApi.setPivotColumns(pivotCols);
      }
    }
  }, [gridState]);

	// Use the gridState from Zustand as initialState
  useEffect(() => {
    if (gridState) {
      console.log("Setting initial state from Zustand store");
    }
  }, [gridState]);

  const onGridPreDestroyed = useCallback((params: any) => {
    const { state } = params;
    console.log("Grid state on destroy (can be persisted)", state);
    setGridState(state);
  }, [setGridState]);

  const onStateUpdated = useCallback((params: any) => {
    const newState = params.state;
		console.log("Grid state updated", newState);
    setGridState(newState);
  }, [setGridState]);

	// You can use this function to manually save the state
  const saveCurrentState = useCallback(() => {
    if (gridRef.current && gridRef.current.api) {
      const state = gridRef.current.api.getState();
      setGridState(state);
      console.log("Manually saved grid state", state);
    }
  }, [setGridState]);

	return (
		<div style={{ width: "100%", height: '90vh' }}>
			<button onClick={saveCurrentState} style={{ marginTop: '10px', marginBottom: '10px' }}>Save Grid State</button>
			<AgGridReact
				ref={gridRef}
				rowData={rowData}
				columnDefs={columnDefs}
				defaultColDef={defaultColDef}
				sideBar={true}
				pagination={true}
				rowSelection={rowSelection as any}
				suppressColumnMoveAnimation={true}
				initialState={gridState}
				onGridReady={onGridReady}
				onGridPreDestroyed={onGridPreDestroyed}
				onStateUpdated={onStateUpdated}
			/>
		</div>
	);
}

export default GridComponent