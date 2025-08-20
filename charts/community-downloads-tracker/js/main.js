const { AgCharts } = agCharts;

async function initChart() {
  const { data, totalDownloads } = await getData();

  const options = {
    container: document.getElementById('myChart'),
    data: data,
    title: {
      text: [
        { text: 'AG Charts Community Downloads' },
        {
          text: ` (${totalDownloads.toLocaleString()})`,
          fontWeight: 'bold',
        },
      ],
    },
    subtitle: {
      text: 'Data from NPM between 01/2020 to present',
    },
    height: 600,
    zoom: {
      enabled: true,
    },
    series: [
      {
        type: 'area',
        xKey: 'timestamp',
        yKey: 'price',
        yName: 'Downloads',
        marker: { enabled: true, size: 4, stroke: '#55B2C6' },
        fill: {
          type: 'gradient',
          colorStops: [
            { color: '#fafafa', stop: 0 },
            { color: '#0e4491', stop: 1 },
          ],
        },
        stroke: '#55B2C6',
        strokeWidth: 1,
        tooltip: {
          renderer: ({ datum }) => {
            // Use the year and month directly from the data
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
            const monthName = `${months[datum.month - 1]} ${datum.year}`;

            // Format growth percentages
            const formatGrowth = (growth) => {
              if (growth === null || growth === undefined) return 'N/A';
              const sign = growth >= 0 ? '+' : '';
              return `${sign}${growth.toFixed(1)}%`;
            };

            const formatGrowthColor = (growth) => {
              if (growth === null || growth === undefined) return '#6b7280';
              return growth >= 0 ? '#059669' : '#dc2626';
            };

            const monthGrowthText = formatGrowth(datum.monthOverMonthGrowth);
            const monthGrowthColor = formatGrowthColor(
              datum.monthOverMonthGrowth
            );
            const yearGrowthText = formatGrowth(datum.yearOverYearGrowth);
            const yearGrowthColor = formatGrowthColor(datum.yearOverYearGrowth);

            return `
              <div style="padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e1e5e9;">
                <div style="margin-bottom: 8px;">
                  <span style="font-size: 12px; color: #6b728090; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Month</span>
                  <div style="font-size: 14px; color: #1f2937; font-weight: 500; margin-top: 2px;">${monthName}</div>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="font-size: 12px; color: #6b728090; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Downloads</span>
                  <div style="font-size: 14px; color: #0e4491; font-weight: 500; margin-top: 2px;">${datum.price.toLocaleString()}</div>
                </div>
                <div style="display: flex; gap: 16px;">
                  <div style="flex: 1;">
                    <span style="font-size: 10px; color: #6b728090; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">vs Prev Month</span>
                    <div style="font-size: 12px; color: ${monthGrowthColor}; font-weight: 500; margin-top: 2px;">${monthGrowthText}</div>
                  </div>
                  <div style="flex: 1;">
                    <span style="font-size: 10px; color: #6b728090; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">vs Prev Year</span>
                    <div style="font-size: 12px; color: ${yearGrowthColor}; font-weight: 500; margin-top: 2px;">${yearGrowthText}</div>
                  </div>
                </div>
              </div>
            `;
          },
        },
      },
    ],
    axes: [
      {
        type: 'number',
        position: 'left',
        title: { text: 'Monthly Downloads' },
        gridLine: {
          enabled: true,
        },
        label: {
          formatter: ({ value }) => {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}m`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}k`;
            }
            return value.toString();
          },
        },
      },
      {
        type: 'time',
        position: 'bottom',
        nice: false,
        gridLine: {
          enabled: true,
        },
      },
    ],
  };

  AgCharts.create(options);
}

// Initialize the chart when the page loads
initChart();
