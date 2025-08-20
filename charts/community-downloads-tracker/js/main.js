const { AgCharts } = agCharts;

function formatDateTooltip(date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  // Add ordinal suffix
  let dayWithSuffix;
  if (day >= 11 && day <= 13) {
    dayWithSuffix = day + 'th';
  } else {
    switch (day % 10) {
      case 1:
        dayWithSuffix = day + 'st';
        break;
      case 2:
        dayWithSuffix = day + 'nd';
        break;
      case 3:
        dayWithSuffix = day + 'rd';
        break;
      default:
        dayWithSuffix = day + 'th';
        break;
    }
  }

  return `${dayWithSuffix} ${month} ${year}`;
}

async function initChart() {
  const { data, totalDownloads } = await getData();

  const options = {
    container: document.getElementById('myChart'),
    data: data,
    title: {
      text: `AG Charts Community - Weekly Downloads (${totalDownloads.toLocaleString()} total)`,
    },
    height: 600,
    zoom: {
      enabled: true,
      anchorPointX: 'pointer',
      anchorPointY: 'pointer',
      autoScaling: {
        enabled: true,
      },
    },
    initialState: {
      zoom: {
        rangeX: {
          start: {
            __type: 'date',
            value: new Date('2023-01-01').toISOString(),
          },
        },
      },
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
            const weekStart = formatDateTooltip(new Date(datum.weekStart));
            const weekEnd = formatDateTooltip(new Date(datum.weekEnd));

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

            const weekGrowthText = formatGrowth(datum.weekOverWeekGrowth);
            const weekGrowthColor = formatGrowthColor(datum.weekOverWeekGrowth);
            const yearGrowthText = formatGrowth(datum.yearOverYearGrowth);
            const yearGrowthColor = formatGrowthColor(datum.yearOverYearGrowth);

            return `
              <div style="padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e1e5e9;">
                <div style="margin-bottom: 8px;">
                  <span style="font-size: 12px; color: #6b728090; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Week</span>
                  <div style="font-size: 14px; color: #1f2937; font-weight: 500; margin-top: 2px;">${weekStart} - ${weekEnd}</div>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="font-size: 12px; color: #6b728090; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Downloads</span>
                  <div style="font-size: 14px; color: #0e4491; font-weight: 500; margin-top: 2px;">${datum.price.toLocaleString()}</div>
                </div>
                <div style="display: flex; gap: 16px;">
                  <div style="flex: 1;">
                    <span style="font-size: 10px; color: #6b728090; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">vs Prev Week</span>
                    <div style="font-size: 12px; color: ${weekGrowthColor}; font-weight: 500; margin-top: 2px;">${weekGrowthText}</div>
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
        title: { text: 'Weekly Downloads' },
      },
      {
        type: 'time',
        position: 'bottom',
        nice: false,
        crossLines: [
          {
            type: 'line',
            value: new Date('2023-10-10').getTime(),
            stroke: '#B4BBBF',
            strokeWidth: 2,
            strokeOpacity: 0.8,
            lineDash: [4, 4],
            label: {
              text: 'AG Charts Enterprise',
              position: 'inside-right',
              rotation: 90,
              color: '#666c70ff',
              fontStyle: 'bold',
            },
          },
          {
            type: 'line',
            value: new Date('2024-07-01').getTime(),
            stroke: '#B4BBBF',
            strokeWidth: 2,
            strokeOpacity: 0.8,
            lineDash: [4, 4],
            label: {
              text: 'AG Charts 10.0',
              position: 'inside-right',
              rotation: 90,
              color: '#666c70ff',
              fontStyle: 'bold',
            },
          },
          {
            type: 'line',
            value: new Date('2024-12-11').getTime(),
            stroke: '#B4BBBF',
            strokeWidth: 2,
            strokeOpacity: 0.8,
            lineDash: [4, 4],
            label: {
              text: 'AG Charts 11.0',
              position: 'inside-right',
              rotation: 90,
              color: '#666c70ff',
              fontStyle: 'bold',
            },
          },
          {
            type: 'line',
            value: new Date('2025-06-25').getTime(),
            stroke: '#B4BBBF',
            strokeWidth: 2,
            strokeOpacity: 0.8,
            lineDash: [4, 4],
            label: {
              text: 'AG Charts 12.0',
              position: 'inside-right',
              rotation: 90,
              color: '#666c70ff',
              fontStyle: 'bold',
            },
          },
        ],
      },
    ],
  };

  const chart = AgCharts.create(options);
}

// Initialize the chart when the page loads
initChart();
