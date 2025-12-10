function sfc32(a, b, c, d) {
    return function () {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

function seedRandom(seed = 1337) {
    const realSeed = seed ^ 0xdeadbeef;
    return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, realSeed);
}

const random = seedRandom(12345);

function getData() {
    const startTimestamp = Date.UTC(2024, 0, 1);
    const DAY_MS = 24 * 60 * 60 * 1000;
    const data = [];

    for (let i = 0; i < 50; i++) {
        data.push({
            date: startTimestamp + i * DAY_MS,
            price: 100 + Math.sin(i / 5) * 20 + random() * 10,
        });
    }

    return data;
}

function getNextDataPoint(currentData) {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const lastPoint = currentData[currentData.length - 1];

    return {
        date: lastPoint.date + DAY_MS,
        price: lastPoint.price + (random() - 0.5) * 10,
    };
}
