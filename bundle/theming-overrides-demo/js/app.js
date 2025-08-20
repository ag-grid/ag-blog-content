// Global theme object
let currentTheme = {
  common: {
    title: {
      enabled: true,
      text: 'Enterprise Revenue Growth',
      color: '#333333',
      fontWeight: 'bold',
    },
    subtitle: {
      enabled: true,
      text: 'Accelerating growth trajectory',
    },
    padding: {
      left: 0,
      right: 0,
    },
    background: {
      fill: '#f8f9fa',
    },
    legend: {
      enabled: true,
    },
    axes: {
      category: {
        line: {
          width: 4,
        },
        bottom: {
          title: {
            enabled: true,
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
            formatter: (params) => `$${params.value}M`,
          },
          keys: ['revenue'],
        },
        right: {
          title: {
            enabled: true,
            text: 'Growth (%)',
          },
          label: {
            formatter: (params) => `${params.value}%`,
          },
          min: 0,
          keys: ['growth'],
        },
      },
    },
  },
  area: {
    series: {
      marker: {
        enabled: true,
        shape: 'circle',
      },
      fill: {
        type: 'gradient',
        colorStops: [
          { stop: 0, color: '#f0f8ff' },
          { stop: 0.5, color: '#b0e0e6' },
          { stop: 1, color: '#add8e6' },
        ],
        rotation: 0,
      },
    },
  },
  line: {
    series: {
      marker: {
        enabled: false,
        shape: 'circle',
      },
      stroke: '#788990ff',
      lineDash: [5, 5],
    },
  },
};

// Sample data - matching React data exactly
const rowData = [
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
];

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

// Helper function to update nested object properties
function setNestedProperty(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
  return obj;
}

// Function to update theme
function updateTheme(path, value) {
  const newTheme = JSON.parse(JSON.stringify(currentTheme));
  setNestedProperty(newTheme, path, value);
  currentTheme = newTheme;

  // Update both charts
  updateIntegratedChart();
  updateStandaloneChart();
}

// Update integrated chart theme
function updateIntegratedChart() {
  console.log(
    'Updating integrated chart with theme:',
    integratedChart?.chartId
  );
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
    const options = {
      data: rowData,
      theme: { overrides: currentTheme },
      series: [
        {
          type: 'area',
          xKey: 'quarter',
          yKey: 'revenue',
          yName: 'Revenue ($M)',
        },
        {
          type: 'line',
          xKey: 'quarter',
          yKey: 'growth',
          yName: 'Growth (%)',
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
    };

    standaloneChart.update(options);
  }
}

// Initialize form event listeners
function initializeFormListeners() {
  // Layout
  document.getElementById('xAxisTitle').addEventListener('input', (e) => {
    updateTheme('common.axes.category.bottom.title.text', e.target.value);
  });

  document.getElementById('yAxisTitleLeft').addEventListener('input', (e) => {
    updateTheme('common.axes.number.left.title.text', e.target.value);
  });

  document.getElementById('yAxisTitleRight').addEventListener('input', (e) => {
    updateTheme('common.axes.number.right.title.text', e.target.value);
  });

  // Area Styling
  document.getElementById('areaColorStart').addEventListener('input', (e) => {
    updateTheme('area.series.fill.colorStops.0.color', e.target.value);
  });

  document.getElementById('areaColorMid').addEventListener('input', (e) => {
    updateTheme('area.series.fill.colorStops.1.color', e.target.value);
  });

  document.getElementById('areaColorEnd').addEventListener('input', (e) => {
    updateTheme('area.series.fill.colorStops.2.color', e.target.value);
  });

  document.getElementById('areaRotation').addEventListener('input', (e) => {
    document.getElementById('rotationValue').textContent = e.target.value;
    updateTheme('area.series.fill.rotation', parseInt(e.target.value));
  });

  document.getElementById('areaMarkers').addEventListener('change', (e) => {
    updateTheme('area.series.marker.enabled', e.target.checked);
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

// Initialize AG Grid
function initializeGrid() {
  const gridOptions = {
    rowData: rowData,
    columnDefs: columnDefs,
    defaultColDef: defaultColDef,
    chartThemeOverrides: currentTheme,
    onGridReady: (params) => {
      gridApi = params.api;

      // Create integrated chart
      integratedChart = params.api.createRangeChart({
        chartType: 'customCombo',
        cellRange: {
          columns: ['quarter', 'revenue', 'growth'],
        },
        seriesChartTypes: [
          { colId: 'growth', chartType: 'line', secondaryAxis: true },
          { colId: 'revenue', chartType: 'area', secondaryAxis: false },
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
    container: document.getElementById('myChart'),
    data: rowData,
    theme: { overrides: currentTheme },
    series: [
      {
        type: 'area',
        xKey: 'quarter',
        yKey: 'revenue',
        yName: 'Revenue ($M)',
      },
      {
        type: 'line',
        xKey: 'quarter',
        yKey: 'growth',
        yName: 'Growth (%)',
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
  };

  standaloneChart = agCharts.AgCharts.create(options);
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeFormListeners();
  initializeGrid();
  initializeStandaloneChart();
});
