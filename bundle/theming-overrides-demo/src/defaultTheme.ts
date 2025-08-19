import type { AgChartThemeOverrides } from 'ag-charts-enterprise';

export const defaultTheme: AgChartThemeOverrides = {
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
      left: 70,
      right: 70,
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
