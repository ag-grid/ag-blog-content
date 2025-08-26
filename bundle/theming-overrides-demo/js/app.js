// Global theme object
let currentTheme = {
  common: {
    title: {
      enabled: false,
      text: 'Enterprise Revenue Growth',
      color: '#333333',
      fontWeight: 'bold',
    },
    subtitle: {
      enabled: false,
      text: 'FY2024 - Last 4 Quarters',
    },
    padding: {
      left: 6,
      right: 6,
    },
    legend: {
      enabled: false,
    },
    zoom: {
      enabled: true,
    },
    axes: {
      category: {
        line: {
          width: 4,
        },
        bottom: {
          title: {
            enabled: false,
            text: 'Quarters',
          },
          keys: ['quarter'],
        },
      },
      number: {
        left: {
          title: {
            enabled: true,
            text: 'Revenue (Millions USD)',
          },
          label: {
            formatter: (params) => `$${formatNumber(params.value)}`,
          },
          keys: ['revenue'],
        },
        right: {
          title: {
            enabled: true,
            text: 'Enterprise Customers',
          },
          label: {
            formatter: (params) => formatNumber(params.value),
          },
          min: 0,
          keys: ['customers'],
        },
      },
    },
  },
  bar: {
    series: {
      fill: {
        type: 'gradient',
        colorStops: [
          { stop: 0, color: '#00B0F0' },
          { stop: 1, color: '#0073CC' },
        ],
        rotation: 90,
      },
      stroke: '#0073CC',
      strokeWidth: 1,
    },
  },
  line: {
    series: {
      marker: {
        enabled: false,
        shape: 'circle',
      },
      stroke: '#f3931eff',
      lineDash: [5, 5],
    },
  },
};

// Initialize form event listeners
function initializeFormListeners() {
  // Layout
  document.getElementById('yAxisTitleLeft').addEventListener('input', (e) => {
    updateTheme('common.axes.number.left.title.text', e.target.value);
  });
  document.getElementById('yAxisTitleRight').addEventListener('input', (e) => {
    updateTheme('common.axes.number.right.title.text', e.target.value);
  });

  // Bar Styling
  document.getElementById('barColorStart').addEventListener('input', (e) => {
    updateTheme('bar.series.fill.colorStops.0.color', e.target.value);
  });

  document.getElementById('barColorEnd').addEventListener('input', (e) => {
    updateTheme('bar.series.fill.colorStops.1.color', e.target.value);
  });

  document.getElementById('barRotation').addEventListener('input', (e) => {
    document.getElementById('rotationValue').textContent = e.target.value;
    updateTheme('bar.series.fill.rotation', parseInt(e.target.value));
  });

  document.getElementById('barStrokeColor').addEventListener('input', (e) => {
    updateTheme('bar.series.stroke', e.target.value);
  });

  document.getElementById('barStrokeWidth').addEventListener('input', (e) => {
    document.getElementById('strokeWidthValue').textContent = e.target.value;
    updateTheme('bar.series.strokeWidth', parseInt(e.target.value));
  });

  // Line Styling
  document.getElementById('lineStrokeColor').addEventListener('input', (e) => {
    updateTheme('line.series.stroke', e.target.value + 'ff');
  });

  document.getElementById('lineMarkers').addEventListener('change', (e) => {
    updateTheme('line.series.marker.enabled', e.target.checked);
  });

  document.getElementById('dashLength').addEventListener('input', (e) => {
    updateTheme('line.series.lineDash.0', parseInt(e.target.value));
  });

  document.getElementById('gapLength').addEventListener('input', (e) => {
    updateTheme('line.series.lineDash.1', parseInt(e.target.value));
  });

  // Visibility
  document.getElementById('showTitle').addEventListener('change', (e) => {
    updateTheme('common.title.enabled', e.target.checked);
  });

  document.getElementById('showSubtitle').addEventListener('change', (e) => {
    updateTheme('common.subtitle.enabled', e.target.checked);
  });

  document.getElementById('showLegend').addEventListener('change', (e) => {
    updateTheme('common.legend.enabled', e.target.checked);
  });
}

// Sample data - last 4 quarters
const rowData = [
  { quarter: 'Q1 2024', revenue: 19800000, growth: 108, customers: 6720 },
  { quarter: 'Q2 2024', revenue: 22100000, growth: 115, customers: 7380 },
  { quarter: 'Q3 2024', revenue: 24800000, growth: 122, customers: 8150 },
  { quarter: 'Q4 2024', revenue: 28200000, growth: 132, customers: 9100 },
];

// Standalone chart options
const chartOptions = {
  container: document.getElementById('myChart'),
  data: rowData,
  theme: { overrides: currentTheme },
  series: [
    {
      type: 'bar',
      xKey: 'quarter',
      yKey: 'revenue',
      yName: 'Revenue ($M)',
    },
    {
      type: 'line',
      xKey: 'quarter',
      yKey: 'customers',
      yName: 'Customers',
    },
  ],
  axes: [
    { type: 'category', position: 'bottom' },
    {
      type: 'number',
      position: 'left',
    },
    {
      type: 'number',
      position: 'right',
    },
  ],
};

// Grid and chart instances
let gridApi;
let standaloneChart;
let integratedChart;

// Column definitions
const columnDefs = [
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

// Default column definition
const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  flex: 1,
};

// Function to update theme
function updateTheme(path, value) {
  const newTheme = JSON.parse(JSON.stringify(currentTheme));
  setNestedProperty(newTheme, path, value);
  currentTheme = newTheme;

  // Update both charts immediately
  updateIntegratedChart();
  updateStandaloneChart();
}

// Update integrated chart theme
function updateIntegratedChart() {
  if (gridApi) {
    gridApi.updateChart({
      type: 'rangeChartUpdate',
      chartId: integratedChart?.chartId,
      chartThemeOverrides: currentTheme,
    });
  }
}

// Update standalone chart
function updateStandaloneChart() {
  if (standaloneChart) {
    standaloneChart.updateDelta({
      theme: { overrides: currentTheme },
    });
  }
}

// Initialize AG Grid
function initializeGrid() {
  const gridOptions = {
    rowData: rowData,
    columnDefs: columnDefs,
    defaultColDef: defaultColDef,
    chartThemeOverrides: {
      ...currentTheme,
      common: {
        ...currentTheme.common,
        title: {
          enabled: false,
          text: 'Integrated Chart Example',
          color: '#333333',
          fontWeight: 'bold',
        },
      },
    },
    onGridReady: (params) => {
      gridApi = params.api;

      // Create integrated chart
      integratedChart = params.api.createRangeChart({
        chartType: 'customCombo',
        cellRange: {
          columns: ['quarter', 'revenue', 'customers'],
        },
        seriesChartTypes: [
          {
            colId: 'revenue',
            chartType: 'groupedColumn',
            secondaryAxis: false,
          },
          { colId: 'customers', chartType: 'line', secondaryAxis: true },
        ],
      });

      if (integratedChart) {
        integratedChart.setMaximized(true);
      }
    },
  };

  const gridDiv = document.querySelector('#myGrid');
  new agGrid.createGrid(gridDiv, gridOptions);
}

// Initialize standalone chart
function initializeStandaloneChart() {
  const options = {
    theme: { overrides: currentTheme },
    ...chartOptions,
  };

  standaloneChart = agCharts.AgCharts.create(options);
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeFormListeners();
  initializeGrid();
  initializeStandaloneChart();
});
