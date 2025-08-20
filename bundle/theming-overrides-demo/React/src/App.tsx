import { useState, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AgCharts } from 'ag-charts-react';
import type {
  AgCartesianChartOptions,
  AgChartThemeOverrides,
} from 'ag-charts-community';
import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { defaultTheme } from './defaultTheme';
import { ThemeForm } from './ThemeForm';
import './App.css';

ModuleRegistry.registerModules([
  AllEnterpriseModule.with(AgChartsEnterpriseModule),
]);

interface RevenueData {
  quarter: string;
  revenue: number;
  growth: number;
  customers: number;
}

function App() {
  const [theme, setTheme] = useState(defaultTheme);
  const [rowData] = useState<RevenueData[]>([
    { quarter: 'Q1 2019', revenue: 2.4, growth: 12, customers: 1200 },
    { quarter: 'Q2 2019', revenue: 2.8, growth: 18, customers: 1350 },
    { quarter: 'Q3 2019', revenue: 3.1, growth: 22, customers: 1480 },
    { quarter: 'Q4 2019', revenue: 3.6, growth: 28, customers: 1650 },
    { quarter: 'Q1 2020', revenue: 3.2, growth: -8, customers: 1580 },
    { quarter: 'Q2 2020', revenue: 2.9, growth: -15, customers: 1520 },
    { quarter: 'Q3 2020', revenue: 3.8, growth: 24, customers: 1720 },
    { quarter: 'Q4 2020', revenue: 4.2, growth: 35, customers: 1890 },
    { quarter: 'Q1 2021', revenue: 4.8, growth: 42, customers: 2100 },
    { quarter: 'Q2 2021', revenue: 5.6, growth: 48, customers: 2350 },
    { quarter: 'Q3 2021', revenue: 6.2, growth: 52, customers: 2580 },
    { quarter: 'Q4 2021', revenue: 7.1, growth: 58, customers: 2820 },
    { quarter: 'Q1 2022', revenue: 8.3, growth: 65, customers: 3150 },
    { quarter: 'Q2 2022', revenue: 9.1, growth: 68, customers: 3420 },
    { quarter: 'Q3 2022', revenue: 9.8, growth: 71, customers: 3680 },
    { quarter: 'Q4 2022', revenue: 11.2, growth: 76, customers: 4100 },
    { quarter: 'Q1 2023', revenue: 12.8, growth: 82, customers: 4580 },
    { quarter: 'Q2 2023', revenue: 14.1, growth: 88, customers: 5020 },
    { quarter: 'Q3 2023', revenue: 15.6, growth: 94, customers: 5480 },
    { quarter: 'Q4 2023', revenue: 17.4, growth: 102, customers: 6050 },
    { quarter: 'Q1 2024', revenue: 19.8, growth: 108, customers: 6720 },
    { quarter: 'Q2 2024', revenue: 22.1, growth: 115, customers: 7380 },
    { quarter: 'Q3 2024', revenue: 24.8, growth: 122, customers: 8150 },
    { quarter: 'Q4 2024', revenue: 28.2, growth: 132, customers: 9100 },
  ]);

  const columnDefs: ColDef[] = [
    { field: 'quarter', headerName: 'Quarter', minWidth: 100 },
    {
      field: 'revenue',
      headerName: 'Revenue ($M)',
      minWidth: 120,
      valueFormatter: (params) => `$${params.value}M`,
    },
    {
      field: 'growth',
      headerName: 'Growth %',
      minWidth: 100,
      valueFormatter: (params) => `${params.value}%`,
    },
    {
      field: 'customers',
      headerName: 'Enterprise Customers',
      minWidth: 150,
      valueFormatter: (params) => params.value.toLocaleString(),
    },
  ];

  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
    }),
    []
  );

  const chartOptions: AgCartesianChartOptions = useMemo(
    () => ({
      data: rowData,
      theme: { overrides: theme as AgChartThemeOverrides },
      series: [
        {
          type: 'area' as const,
          xKey: 'quarter',
          yKey: 'revenue',
          yName: 'Revenue ($M)',
        },
        {
          type: 'line' as const,
          xKey: 'quarter',
          yKey: 'growth',
        },
      ],
      axes: [
        {
          type: 'category',
          position: 'bottom',
        },
        {
          type: 'number',
          position: 'left',
        },
        {
          type: 'number',
          position: 'right',
        },
      ],
    }),
    [rowData, theme]
  );

  const onGridReady = useCallback((event: GridReadyEvent) => {
    const rangeChart = event.api.createRangeChart({
      chartType: 'customCombo',
      cellRange: {
        columns: ['quarter', 'revenue', 'growth'],
      },
      seriesChartTypes: [
        { colId: 'growth', chartType: 'line', secondaryAxis: true },
        { colId: 'revenue', chartType: 'area', secondaryAxis: false },
      ],
    });

    rangeChart?.setMaximized(true);
  }, []);

  return (
    <div className="app-container">
      <div className="main-layout">
        <div className="theme-sidebar">
          <ThemeForm theme={theme} onThemeChange={setTheme} />
        </div>

        <div className="content-area">
          <div className="chart-card">
            <h2 className="chart-card-title">Integrated Charts</h2>
            <div className="chart-card-content">
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                chartThemeOverrides={theme}
              />
            </div>
          </div>

          <div className="chart-card">
            <h2 className="chart-card-title">Standalone Charts</h2>
            <div className="chart-card-content">
              <AgCharts options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
