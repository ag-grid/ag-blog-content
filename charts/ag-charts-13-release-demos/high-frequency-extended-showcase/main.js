const { AgCharts } = agCharts;

let rollingWindowSize = 50000;
let batchSize = 10;
let updateSpeed = 'raf';

let currentSeriesType = 'line';
let currentUpdateMode = 'append';

let data = [];
let nextIndex = 0;
let lastBasePrice = undefined;
let intervalId = undefined;

function createSeriesConfig(seriesType) {
    switch (seriesType) {
        case 'ohlc':
        case 'candlestick':
            return [
                {
                    type: seriesType,
                    xKey: 'timestamp',
                    openKey: 'open',
                    highKey: 'high',
                    lowKey: 'low',
                    closeKey: 'close',
                },
            ];
        case 'stacked-bar':
            return [
                { type: 'bar', xKey: 'timestamp', yKey: 'value', stacked: true },
                { type: 'bar', xKey: 'timestamp', yKey: 'value2', stacked: true },
            ];
        case 'stacked-area':
            return [
                { type: 'area', xKey: 'timestamp', yKey: 'value', stacked: true, marker: { enabled: false } },
                { type: 'area', xKey: 'timestamp', yKey: 'value2', stacked: true, marker: { enabled: false } },
            ];
        case 'range-area':
            return [
                {
                    type: 'range-area',
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ];
        case 'range-bar':
            return [
                {
                    type: 'range-bar',
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                },
            ];
        case 'area':
            return [
                {
                    type: 'area',
                    xKey: 'timestamp',
                    yKey: 'value',
                    marker: { enabled: false },
                    strokeWidth: 1,
                },
            ];
        case 'bar':
            return [
                {
                    type: 'bar',
                    xKey: 'timestamp',
                    yKey: 'value',
                },
            ];
        case 'line':
        default:
            return [
                {
                    type: 'line',
                    xKey: 'timestamp',
                    yKey: 'value',
                    marker: { enabled: false },
                    strokeWidth: 1,
                },
            ];
    }
}

const options = {
    container: document.getElementById('myChart'),
    data,
    animation: { enabled: false },
    zoom: { enabled: true, onDataChange: { strategy: 'preserveDomain', stickToEnd: true } },
    axes: {
        x: {
            type: 'time',
            position: 'bottom',
            nice: false,
            label: {
                format: '%H:%M:%S',
            },
        },
        y: {
            min: 0,
            max: 100,
        },
    },
    series: createSeriesConfig(currentSeriesType),
    legend: { enabled: false },
};

const chart = AgCharts.create(options);

let isRunning = false;
let animationFrameId = undefined;

// Stats tracking
let frameCount = 0;
let lastFpsTime = performance.now();
let fps = 0;
let pointsThisSecond = 0;
let lastPointsTime = performance.now();
let pointsPerSec = 0;
let totalPointsAdded = 0;

function updateStats() {
    const statsEl = document.getElementById('stats');
    if (statsEl) {
        statsEl.innerHTML = `
            <span class="stat">Points: <strong>${data.length.toLocaleString()}</strong></span>
            <span class="stat">FPS: <strong>${fps}</strong></span>
            <span class="stat">Points/sec: <strong>${pointsPerSec.toLocaleString()}</strong></span>
            <span class="stat">Total added: <strong>${totalPointsAdded.toLocaleString()}</strong></span>
        `;
    }
}

function runUpdate() {
    if (!isRunning) return;

    const now = performance.now();

    // Calculate FPS
    frameCount++;
    if (now - lastFpsTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        frameCount = 0;
        lastFpsTime = now;
    }

    // Calculate points per second
    if (now - lastPointsTime >= 1000) {
        pointsPerSec = pointsThisSecond;
        pointsThisSecond = 0;
        lastPointsTime = now;
        updateStats();
    }

    switch (currentUpdateMode) {
        case 'rolling':
            performRollingUpdate();
            break;
        case 'append':
            performAppendUpdate();
            break;
    }

    animationFrameId = requestAnimationFrame(runUpdate);
}

function performRollingUpdate() {
    const { data: newPoints, lastBasePrice: newBasePrice } = generateBatch(
        nextIndex,
        batchSize,
        currentSeriesType,
        lastBasePrice
    );
    nextIndex += batchSize;
    lastBasePrice = newBasePrice;
    pointsThisSecond += batchSize;
    totalPointsAdded += batchSize;

    const atCapacity = data.length >= rollingWindowSize;
    const pointsToRemove = atCapacity ? data.slice(0, batchSize) : [];

    chart.applyTransaction({
        remove: pointsToRemove,
        add: newPoints,
    });

    if (atCapacity) {
        data.splice(0, batchSize);
    }
    data.push(...newPoints);
}

function performAppendUpdate() {
    const { data: newPoints, lastBasePrice: newBasePrice } = generateBatch(
        nextIndex,
        batchSize,
        currentSeriesType,
        lastBasePrice
    );
    nextIndex += batchSize;
    lastBasePrice = newBasePrice;
    pointsThisSecond += batchSize;
    totalPointsAdded += batchSize;

    chart.applyTransaction({
        add: newPoints,
    });

    data.push(...newPoints);
}

function startUpdates() {
    if (isRunning) return;
    isRunning = true;
    frameCount = 0;
    lastFpsTime = performance.now();
    pointsThisSecond = 0;
    lastPointsTime = performance.now();
    updateButton();
    scheduleUpdate();
}

function scheduleUpdate() {
    if (updateSpeed === 'raf') {
        animationFrameId = requestAnimationFrame(runUpdate);
    } else {
        intervalId = setInterval(runUpdateInterval, updateSpeed);
    }
}

function runUpdateInterval() {
    if (!isRunning) return;

    const now = performance.now();

    frameCount++;
    if (now - lastFpsTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        frameCount = 0;
        lastFpsTime = now;
    }

    if (now - lastPointsTime >= 1000) {
        pointsPerSec = pointsThisSecond;
        pointsThisSecond = 0;
        lastPointsTime = now;
        updateStats();
    }

    switch (currentUpdateMode) {
        case 'rolling':
            performRollingUpdate();
            break;
        case 'append':
            performAppendUpdate();
            break;
    }
}

function stopUpdates() {
    if (!isRunning) return;
    isRunning = false;
    updateButton();
    if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = undefined;
    }
    if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
}

function toggleUpdates1() {
    if (isRunning) {
        stopUpdates();
    } else {
        startUpdates();
    }
}

function updateButton() {
    const button = document.getElementById('toggleBtn');
    if (button) {
        button.textContent = isRunning ? 'Stop' : 'Start';
    }
}

function updateSeriesType1(value) {
    const wasRunning = isRunning;
    if (wasRunning) stopUpdates();

    currentSeriesType = value;
    resetGenerator();

    const pointsToRemove = [...data];
    data = [];
    nextIndex = 0;
    lastBasePrice = undefined;
    totalPointsAdded = 0;

    chart.applyTransaction({ remove: pointsToRemove });
    options.series = createSeriesConfig(currentSeriesType);
    chart.update(options);

    updateStats();
    if (wasRunning) startUpdates();
}

function updateMode(value) {
    const wasRunning = isRunning;
    if (wasRunning) stopUpdates();

    currentUpdateMode = value;
    updateRollingWindowSelectState();
    resetGenerator();

    const pointsToRemove = [...data];
    data = [];
    nextIndex = 0;
    lastBasePrice = undefined;
    totalPointsAdded = 0;

    chart.applyTransaction({ remove: pointsToRemove });

    updateStats();
    if (wasRunning) startUpdates();
}

function updateRollingWindowSelectState() {
    const select = document.getElementById('rollingWindowSelect');
    if (select) {
        select.disabled = currentUpdateMode !== 'rolling';
    }
}

function updateBatchSize(value) {
    batchSize = parseInt(value, 10);
}

function updateRollingWindowSize(value) {
    const wasRunning = isRunning;
    if (wasRunning) stopUpdates();

    rollingWindowSize = parseInt(value, 10);
    resetGenerator();

    const pointsToRemove = [...data];
    data = [];
    nextIndex = 0;
    lastBasePrice = undefined;
    totalPointsAdded = 0;

    chart.applyTransaction({ remove: pointsToRemove });

    updateStats();
    if (wasRunning) startUpdates();
}

function updateUpdateSpeed(value) {
    const wasRunning = isRunning;
    if (wasRunning) stopUpdates();

    updateSpeed = value === 'raf' ? 'raf' : parseInt(value, 10);

    if (wasRunning) startUpdates();
}

updateStats();
updateRollingWindowSelectState();
