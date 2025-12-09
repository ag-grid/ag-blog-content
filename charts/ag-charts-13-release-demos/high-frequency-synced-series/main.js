// @ag-skip-fws
// @ag-skip-container-check
const { AgCharts } = agCharts;

const WINDOW_SIZE = 1000;
const POINTS_PER_UPDATE = 1;
const CLEANUP_INTERVAL = 500;

const generator = new DataGenerator();
const data = generator.generateInitialData(WINDOW_SIZE);

const NORMAL_COLOR = '#22c55e';
const ANOMALY_COLOR = '#ef4444';
const CROSSLINE_FILL = 'rgba(239, 68, 68, 0.15)';

function buildSegments(channel, windowStart, windowEnd) {
    const ranges = generator.getAnomalyRanges(channel);
    const segments = [];

    const visibleRanges = ranges.filter((r) => {
        const end = r.end ?? windowEnd;
        return end >= windowStart && r.start <= windowEnd;
    });

    if (visibleRanges.length === 0) {
        return [];
    }

    visibleRanges.sort((a, b) => a.start - b.start);

    for (const range of visibleRanges) {
        segments.push({
            stop: range.start,
            stroke: NORMAL_COLOR,
        });

        const end = range.end ?? windowEnd;
        segments.push({
            stop: end,
            stroke: ANOMALY_COLOR,
        });
    }

    return segments;
}

function buildCrossLines(channel, windowStart, windowEnd) {
    const ranges = generator.getAnomalyRanges(channel);
    const crossLines = [];

    const visibleRanges = ranges.filter((r) => {
        const end = r.end ?? windowEnd;
        return end >= windowStart && r.start <= windowEnd;
    });

    for (const range of visibleRanges) {
        const end = range.end ?? windowEnd;
        crossLines.push({
            type: 'range',
            range: [range.start, end],
            fill: CROSSLINE_FILL,
            fillOpacity: 0,
            stroke: ANOMALY_COLOR,
            strokeWidth: 0,
            label: {
                text: 'Anomaly Detected',
                position: 'insideTop',
                fontSize: 9,
                color: ANOMALY_COLOR,
            },
        });
    }

    return crossLines;
}

function createECGChartOptions(channelIndex, containerId) {
    const isFirst = channelIndex === 0;
    const isLast = channelIndex === ECG_CHANNEL_COUNT - 1;

    return {
        minHeight: 0,
        data,
        sync: {
            enabled: true,
            groupId: 'ecg',
        },
        zoom: {
            enabled: true,
            onDataChange: {
                strategy: 'preserveDomain',
                stickToEnd: true,
            },
        },
        legend: { enabled: false },
        container: document.getElementById(containerId),
        padding: {
            top: isFirst ? 10 : 0,
            bottom: isLast ? 10 : 0,
        },
        series: [
            {
                type: 'line',
                xKey: 'x',
                strokeWidth: 1.5,
                marker: { enabled: false },
                yKey: `ecg-${channelIndex + 1}`,
                stroke: NORMAL_COLOR,
                tooltip: { enabled: false },
                segmentation: {
                    key: 'x',
                    segments: [],
                },
            },
        ],
        axes: {
            x: {
                type: 'number',
                position: 'bottom',
                nice: false,
                label: {
                    enabled: isLast,
                    formatter: ({ value }) => `${(value / 60).toFixed(1)}s`,
                },
                line: { enabled: false },
                crosshair: { enabled: false },
                gridLine: { enabled: false },
                crossLines: [],
            },
            y: {
                type: 'number',
                position: 'right',
                min: 0,
                max: 100,
                label: { enabled: false },
                crosshair: { enabled: false },
                gridLine: { enabled: false },
            },
            y2: {
                type: 'number',
                title: {
                    text: `ECG-${channelIndex + 1}`,
                    color: '#000000',
                },
                position: 'left',
                min: 0,
                max: 100,
                label: { enabled: false },
                gridLine: { enabled: false },
            },
        },
    };
}

const charts = [];
const chartOptions = [];
let previousAnomalyChannel = null;

for (let i = 0; i < ECG_CHANNEL_COUNT; i++) {
    const options = createECGChartOptions(i, `myChart${i + 1}`);
    chartOptions.push(options);
    charts.push(AgCharts.create(options));
}

let isRunning = false;
let animationFrameId = undefined;
let updateCount = 0;
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

function updateStats() {
    const statsElement = document.getElementById('stats');
    if (statsElement) {
        statsElement.textContent = `Updates: ${updateCount.toLocaleString()} | FPS: ${fps} | Points: ${data.length.toLocaleString()}`;
    }
}

function updateAnomalyLabel() {
    const anomalyStatus = generator.getAnomalyStatus();

    if (previousAnomalyChannel === anomalyStatus.channel) return;

    if (previousAnomalyChannel !== null && previousAnomalyChannel < ECG_CHANNEL_COUNT) {
        const opts = chartOptions[previousAnomalyChannel];
        opts.axes.y2.title.text = `ECG-${previousAnomalyChannel + 1}`;
        opts.axes.y2.title.color = '#000000';
        charts[previousAnomalyChannel].update(opts);
    }

    if (anomalyStatus.channel !== null && anomalyStatus.channel < ECG_CHANNEL_COUNT) {
        const opts = chartOptions[anomalyStatus.channel];
        opts.axes.y2.title.color = ANOMALY_COLOR;
        charts[anomalyStatus.channel].update(opts);
    }

    previousAnomalyChannel = anomalyStatus.channel;
}

function updateChartStyling() {
    const windowStart = data[0]?.x ?? 0;
    const windowEnd = data[data.length - 1]?.x ?? windowStart + WINDOW_SIZE;

    for (let i = 0; i < ECG_CHANNEL_COUNT; i++) {
        const segments = buildSegments(i, windowStart, windowEnd);
        const crossLines = buildCrossLines(i, windowStart, windowEnd);
        const opts = chartOptions[i];
        opts.series[0].segmentation.segments = segments;
        opts.axes.x.crossLines = crossLines;
    }
}

function updateCharts() {
    if (!isRunning) return;

    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        updateStats();
    }

    const newPoints = generator.generateNextPoints(POINTS_PER_UPDATE);

    updateAnomalyLabel();
    updateChartStyling();

    const pointsToRemove = data.slice(0, POINTS_PER_UPDATE);

    const transaction = {
        remove: pointsToRemove,
        add: newPoints,
    };

    charts.forEach((chart, i) => {
        chart.update(chartOptions[i]);
        chart.applyTransaction(transaction);
    });

    data.splice(0, POINTS_PER_UPDATE);
    data.push(...newPoints);

    if (updateCount % CLEANUP_INTERVAL === 0) {
        const windowStart = data[0]?.x ?? 0;
        generator.cleanupOldRanges(windowStart);
    }

    updateCount++;

    animationFrameId = requestAnimationFrame(updateCharts);
}

function updateButton() {
    const button = document.getElementById('toggleButton');
    if (button) {
        button.textContent = isRunning ? 'Stop' : 'Start';
    }
}

function startUpdates() {
    if (isRunning) return;
    isRunning = true;
    updateButton();
    lastTime = performance.now();
    frameCount = 0;
    animationFrameId = requestAnimationFrame(updateCharts);
}

function stopUpdates() {
    if (!isRunning) return;
    isRunning = false;
    updateButton();
    if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = undefined;
    }
}

function toggleUpdates() {
    if (isRunning) {
        stopUpdates();
    } else {
        startUpdates();
    }
}

updateStats();
