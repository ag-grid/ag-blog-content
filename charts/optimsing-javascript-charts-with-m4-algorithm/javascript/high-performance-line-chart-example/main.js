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
const thousandButton = document.getElementById('1k');
const tenThousandButton = document.getElementById('10k');
const hundredThousandButton = document.getElementById('100k');
const millionButton = document.getElementById('1m');

function setData(points) {
  options.data = getData(points);
  chart.update(options);
  switch (points) {
    case 1e3:
      thousandButton.classList.add('active');
      tenThousandButton.classList.remove('active');
      hundredThousandButton.classList.remove('active');
      millionButton.classList.remove('active');
      break;
    case 1e4:
      thousandButton.classList.remove('active');
      tenThousandButton.classList.add('active');
      hundredThousandButton.classList.remove('active');
      millionButton.classList.remove('active');
      break;
    case 1e5:
      thousandButton.classList.remove('active');
      tenThousandButton.classList.remove('active');
      hundredThousandButton.classList.add('active');
      millionButton.classList.remove('active');
      break;
    case 1e6:
      thousandButton.classList.remove('active');
      tenThousandButton.classList.remove('active');
      hundredThousandButton.classList.remove('active');
      millionButton.classList.add('active');
      break;
    default:
      // Clear active state for all buttons if an unknown value is passed
      thousandButton.classList.remove('active');
      tenThousandButton.classList.remove('active');
      hundredThousandButton.classList.remove('active');
      millionButton.classList.remove('active');
  }
}
