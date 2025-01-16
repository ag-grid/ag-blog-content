import { useState, useMemo, useEffect } from "react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { fetchData, IDataType } from "./api";

export type ICar = {
	make: string;
	model: string;
	price: number;
	electric: boolean;
}

ModuleRegistry.registerModules([AllCommunityModule]);

function App() {
	
	const [rowData, setRowData] = useState<IDataType[] | null>(null);

	useEffect(() => {
    fetchData().then((data) => {
      setRowData(data);
    });
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
			flex: 1
		};
	}, []);

	// Container: Defines the grid's theme & dimensions.
	return (
		<div style={{ width: "100%", height: '100vh' }}>
			<AgGridReact
				rowData={rowData}
				columnDefs={colDefs as any}
				defaultColDef={defaultColDef}
			/>
		</div>
	);
}

export default App