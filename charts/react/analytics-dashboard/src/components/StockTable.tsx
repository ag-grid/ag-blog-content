import { useCallback, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { 
  ModuleRegistry,
  ClientSideRowModelModule, 
  PaginationModule, 
  NumberFilterModule, 
  TextFilterModule, 
  ColDef,
  CellClickedEvent
} from "ag-grid-community";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  PaginationModule,
  NumberFilterModule,
  TextFilterModule
]);

type StockData = {
  current_price: number;
  company_name: string;
  ticker: string;
  amount: number;
  entry_price: number;
  total_price: number;
}

const StockTable = ({stocks, onTickerSelect } : {
  stocks: StockData[]
  onTickerSelect: (ticker: string) => void
}) => {


  const [columnDefs] = useState<ColDef<StockData>[]>([
    {
      headerName: "Company Name",
      field: "company_name",
    },
    {
      headerName: "Ticker",
      field: "ticker",
    },
    {
      headerName: "Shares",
      field: "amount",
      filter: "agNumberColumnFilter",
    },
    {
      headerName: "Entry Price",
      field: "entry_price",
      filter: "agNumberColumnFilter",
    },
    {
      headerName: "Current Price",
      field: "current_price",
      filter: "agNumberColumnFilter",
    },
    {
      headerName: "Total Value",
      valueGetter: (params) => params.data ? 
          (params.data.amount * params.data.current_price).toFixed(2) : 0,
      filter: "agNumberColumnFilter",
    },
	]);

  const defaultColDef = {
    flex: 1,
    resizable: true,
    floatingFilter: true,
    filter: true,
  };

  const gridOptions = {
    enableCharts: true,
    cellSelection: true,
  };

  const onCellClicked = useCallback((event: CellClickedEvent) => {
    if (event.colDef.field === "ticker") {
      onTickerSelect(event.value as string);
    }
  }, []);

  return (
    <div>
      <AgGridReact
        rowData={stocks}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination={true}
        paginationPageSize={10}
        domLayout="autoHeight"
        gridOptions={gridOptions}
        onCellClicked={onCellClicked}
      />
    </div>
  );
};

export default StockTable;