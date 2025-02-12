// App.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AllCommunityModule, ModuleRegistry, ColDef, ICellRendererParams, CellValueChangedEvent, SideBarDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import useStore, { ICar } from "./store/store";
import AddCarForm from "./AddCarForm";

import {
	ColumnsToolPanelModule,
} from "ag-grid-enterprise";

// Register the AG Grid modules
ModuleRegistry.registerModules([
	ColumnsToolPanelModule,
	AllCommunityModule
]);

function App() {
	// Retrieve rowData and fetchRowData from the Zustand store
	const rowData = useStore((state: { rowData: any; }) => state.rowData);
	const fetchRowData = 
		useStore((state: { fetchRowData: any; }) => state.fetchRowData);
	const loading = useStore((state) => state.loading);

	const updateRow = useStore((state) => state.updateRow);
	const gridRef = useRef<AgGridReact<ICar>>(null);

	// When the component mounts, trigger the simulated API call
	useEffect(() => {
		fetchRowData();
	}, [fetchRowData]);

	const [colDefs] = useState<ColDef<ICar>[]>([
		{ field: "make", editable: true, filter: true },
		{ field: "model" },
		{ field: "price", editable: true },
		{ field: "electric" },
		{
			headerName: "Remove",
			// Inline cell renderer
			cellRenderer: (params: ICellRendererParams<ICar>) => {
			  // Access the store's removeRow method
			  const removeRow = useStore((state) => state.removeRow);
	  
			return (
				<button 
				  onClick={() => params.data && removeRow(params.data)}
				  disabled={!params.data}
				>
				  Remove
				</button>
			  );
			},
			// Optional: give it a fixed width
			width: 120,
		},
	]);

	const onCellValueChanged = (event: CellValueChangedEvent<ICar>) => {
		// event.data is the entire updated row object 
		// after the user has finished editing.
		updateRow(event.data);
	};

	const defaultColDef = useMemo(() => ({ flex: 1 }), []);

	const sideBar = useMemo<
		SideBarDef | string | string[] | boolean | null
	>(() => {
		return {
		toolPanels: ["columns"],
		};
	}, []);

	const saveState = useCallback(() => {
		// 1. Get the column state from AG Grid
		const columnState = gridRef.current?.api?.getColumnState();
  
		// 2. Log it, just to verify we're getting the right object
		console.log("Current Column State:", columnState);
		const { saveState: storeSaveState } = useStore.getState();
		if (columnState) {
			storeSaveState(columnState);
		}
	}, []);

	const restoreState = useCallback(() => {
		const { savedColumnState } = useStore.getState();
		if (savedColumnState) {
			gridRef.current!.api.applyColumnState({
				state: savedColumnState,
				applyOrder: true,
			});
		}
	}, []);

	return (
		<div style={{ width: '100%', padding: '1rem' }}>
		  {/* Render the separate form component */}
		  <AddCarForm />

		  <div style={{ display: 'flex', marginTop: '1rem' }}>
            <button onClick={saveState}>Save State</button>
			<button onClick={restoreState}>Restore State</button>
          </div>
	
		  <div style={{ width: '100%', height: '80vh', marginTop: '1rem' }}>
			<AgGridReact
			  rowData={rowData}
			  ref={gridRef}
			  columnDefs={colDefs as any}
			  defaultColDef={defaultColDef}
			  loading={loading}
			  onCellValueChanged={onCellValueChanged}
			  sideBar={sideBar}
			/>
		  </div>
		</div>
	);
}

export default App;
