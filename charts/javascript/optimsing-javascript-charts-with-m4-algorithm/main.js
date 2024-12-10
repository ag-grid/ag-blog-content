const { AgCharts } = agCharts;

const data = [
  {
    dataSize: 1000,
    previous: 96,
    current: 45,
  },
  {
    dataSize: 10000,
    previous: 232,
    current: 54,
  },
  {
    dataSize: 100000,
    previous: 1180,
    current: 155,
  },
  {
    dataSize: 1000000,
    previous: 11207,
    current: 881,
  },
];

const formatter = new Intl.NumberFormat("en-US");

const tooltipRenderer = (params) => {
  return {
    title: ` ${params.yName} Version`,
    content: `Data Size: ${formatter.format(params.datum[params.xKey])}<br/>Time: ${params.datum[params.yKey]} ms`,
  };
};

const xAxisCrosshairFormatter = (p) => ({
  text:
    p.value >= 1000
      ? `${Math.floor(p.value / 1000)}k`
      : `${Math.floor(p.value / 1000000)}`,
});

const yAxisCrosshairFormatter = (p) => ({
  text: `${Math.floor(p.value)}ms`,
});

const options = {
  container: document.getElementById("myChart"),
  title: {
    text: "Rendering Time Comparison",
    fontSize: 18,
  },
  theme: "ag-default-dark",
  data,
  axes: [
    {
      type: "category",
      position: "bottom",
      title: {
        text: "Data Size",
      },
      label: {
        formatter: (params) => {
          const value = params.value;
          if (value >= 1000000) return `${Math.floor(value / 1000000)}M`;
          if (value >= 1000) return `${value / 1000}k`;
          return value;
        },
      },
      crosshair: {
        label: {
          renderer: xAxisCrosshairFormatter,
        },
      },
    },
    {
      type: "number",
      position: "left",
      title: {
        text: "Rendering Time (ms)",
      },
      label: {
        formatter: (params) =>
          params.value > 100
            ? `${formatter.format(Math.floor(params.value))}ms`
            : `${formatter.format(params.value)}ms`,
      },
      crosshair: {
        label: {
          renderer: yAxisCrosshairFormatter,
        },
      },
    },
  ],
  series: [
    {
      type: "bar",
      xKey: "dataSize",
      yKey: "previous",
      yName: "v10.3",
      tooltip: {
        renderer: tooltipRenderer,
      },
      label: {
        enabled: true,
        color: "white",
        formatter: (p) => `${formatter.format(Math.floor(p.value))}ms`,
        placement: "outside-end",
        padding: 10,
      },
    },
    {
      type: "bar",
      xKey: "dataSize",
      yKey: "current",
      yName: "v11.0+",
      tooltip: {
        renderer: tooltipRenderer,
      },
      label: {
        enabled: true,
        color: "white",
        formatter: (p) => `${formatter.format(Math.floor(p.value))}ms`,
        placement: "outside-end",
        padding: 10,
      },
    },
  ],
  legend: {
    position: "top",
  },
};

const chart = AgCharts.create(options);

function setNumberAxis() {
  options.axes[1].type = "number";
  chart.update(options);
}

function setLogAxis() {
  options.axes[1].type = "log";
  chart.update(options);
}
