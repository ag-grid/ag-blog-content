const { AgCharts } = agCharts;

const options = {
  container: document.getElementById('myChart'),
  data: getData(1e3),
  animation: { enabled: false },
  zoom: {
    enabled: true,
    anchorPointX: 'pointer',
    anchorPointY: 'pointer',
    autoScaling: {
      enabled: true,
    },
  },
  navigator: {
    enabled: true,
    miniChart: {
      enabled: true,
    },
  },
  series: [
    {
      type: 'line',
      xKey: 'timestamp',
      yKey: 'price',
      marker: { enabled: false },
    },
  ],
  axes: [{ type: 'number' }, { type: 'time', nice: false }],
};

const chart = AgCharts.create(options);

function setData(points) {
  options.data = getData(points);
  chart.update(options);
}
