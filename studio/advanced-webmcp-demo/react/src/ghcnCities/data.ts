import type {
    AgDataSourceDefinition,
    AgDataSourcesDefinition,
    AgExpressionFieldDefinition,
    AgFieldDefinition,
    AgRelationDefinition,
} from 'ag-studio';

// NOAA GHCN-Daily "world cities" dataset. Weather facts are stored column-wise as
// raw GHCN integers (temperatures/precip in tenths, snow in mm) with dates as
// integer days since 1970-01-01; the scaling and date conversion below are the
// "format in the browser" step, so the shipped asset stays maximally compact.
//
// The asset base URL is supplied by the caller (a docs example passes its
// substituted asset path; the eval harness passes its own served path), so this
// canonical dataset is not bound to any one host's asset layout.
const MS_PER_DAY = 86_400_000;

// Raw column arrays keyed by field id, exactly as emitted by the generator
// (cityId/date are integer arrays; the measures may contain nulls).
type WeatherColumns = Record<string, (number | null)[]>;

// Keyed by base URL, not held once per process: the whole point of taking the URL from the caller
// is that two callers in one process can serve the asset from different roots, and a single cache
// would hand the second caller the first one's data.
const rawColumnsByBaseUrl = new Map<string, Promise<WeatherColumns>>();
const columnCache = new Map<string, (number | null)[]>();

function loadRawColumns(baseUrl: string): Promise<WeatherColumns> {
    let columns = rawColumnsByBaseUrl.get(baseUrl);
    if (columns == null) {
        columns = fetch(`${baseUrl}/weather.columns.json`).then((r) => r.json());
        rawColumnsByBaseUrl.set(baseUrl, columns);
    }
    return columns;
}

// Column values are transformed to display units once and memoised - repeated
// queries for the same field reuse the converted array.
async function getWeatherColumn(baseUrl: string, fieldId: string): Promise<(number | null)[]> {
    const cacheKey = `${baseUrl}\u0000${fieldId}`;
    const cached = columnCache.get(cacheKey);
    if (cached != null) {
        return cached;
    }
    const raw = await loadRawColumns(baseUrl);
    const source = raw[fieldId] ?? [];
    let column: (number | null)[];
    if (fieldId === 'date') {
        // Dates reach the engine as epoch milliseconds, which is the cheapest form it accepts:
        // it converts them with a single division, where an ISO string costs a regex test and
        // three slices per row. Two constraints on this line:
        //  - The multiply is required. A bare number is read as milliseconds, so passing the
        //    stored day integers straight through is not an error, it silently lands every
        //    observation in 1970.
        //  - Do not wrap this in a `new Date(...)`. A Date is read through local calendar
        //    accessors while a number is read as UTC, so a UTC-midnight Date decodes to the
        //    previous day anywhere west of Greenwich - the dataset would shift by a day
        //    depending on the reader's timezone.
        column = source.map((day) => (day == null ? null : day * MS_PER_DAY));
    } else if (fieldId === 'tmax' || fieldId === 'tmin' || fieldId === 'prcp') {
        column = source.map((value) => (value == null ? null : value / 10));
    } else {
        column = source;
    }
    columnCache.set(cacheKey, column);
    return column;
}

const weatherFields: AgFieldDefinition[] = [
    {
        id: 'cityId',
        name: 'City ID',
        description: 'Foreign key to the cities table (cities.id) identifying which city this reading belongs to.',
        format: 'integerFormat',
        cardinality: 'low',
        hide: true,
    },
    {
        id: 'date',
        name: 'Date',
        description: 'Calendar date of the observation. The data is daily - one row per city per day.',
        format: 'dateFormat',
        cardinality: 'high',
        notBlank: true,
    },
    {
        id: 'tmax',
        name: 'Max Temp (°C)',
        description: 'Highest air temperature recorded during the day, in degrees Celsius.',
        format: 'decimalFormat',
        cardinality: 'medium',
    },
    {
        id: 'tmin',
        name: 'Min Temp (°C)',
        description: 'Lowest air temperature recorded during the day, in degrees Celsius.',
        format: 'decimalFormat',
        cardinality: 'medium',
    },
    {
        id: 'prcp',
        name: 'Precipitation (mm)',
        description:
            'Total precipitation for the day (rain plus melted snow), in millimetres. 0 is a dry day; a blank means it was not recorded.',
        format: 'decimalFormat',
        cardinality: 'medium',
    },
    {
        id: 'snow',
        name: 'Snowfall (mm)',
        description:
            'Fresh snow that fell during the day, in millimetres. Usually 0 or blank outside cold-climate cities. Distinct from snow depth.',
        format: 'integerFormat',
        cardinality: 'medium',
    },
    {
        id: 'snwd',
        name: 'Snow Depth (mm)',
        description:
            'Depth of snow lying on the ground at observation time, in millimetres. Distinct from snowfall, which is only the fresh fall that day.',
        format: 'integerFormat',
        cardinality: 'medium',
    },
];

const cityFields: AgFieldDefinition[] = [
    {
        id: 'id',
        name: 'City ID',
        description: 'Primary key; the join target for weather.cityId.',
        format: 'integerFormat',
        cardinality: 'low',
        hide: true,
    },
    {
        id: 'city',
        name: 'City',
        description: 'City name. This is the label most reports group by.',
        format: 'textFormat',
        cardinality: 'low',
    },
    {
        id: 'country',
        name: 'Country',
        description: 'Country the city is located in.',
        format: 'textFormat',
        cardinality: 'low',
    },
    {
        id: 'region',
        name: 'Region',
        description: 'Continent-level grouping, such as Europe, Asia or North America.',
        format: 'textFormat',
        cardinality: 'low',
    },
    {
        id: 'latitudeBand',
        name: 'Climate Band',
        description: 'Climate band derived from latitude: Tropical, Subtropical, Temperate, Subpolar or Polar.',
        format: 'textFormat',
        cardinality: 'low',
    },
    {
        id: 'latitude',
        name: 'Latitude',
        description: 'City-centre latitude in decimal degrees (positive north). Suitable for plotting on a map.',
        format: 'decimalFormat',
        cardinality: 'low',
    },
    {
        id: 'longitude',
        name: 'Longitude',
        description: 'City-centre longitude in decimal degrees (positive east).',
        format: 'decimalFormat',
        cardinality: 'low',
    },
    {
        id: 'elevation',
        name: 'Elevation (m)',
        description: 'Elevation of the backing weather station, in metres above sea level.',
        format: 'decimalFormat',
        cardinality: 'low',
    },
    {
        id: 'stationName',
        name: 'Station',
        description: 'Name of the NOAA GHCN weather station whose readings back this city.',
        format: 'textFormat',
        cardinality: 'low',
    },
];

function getWeatherSource(baseUrl: string): AgDataSourceDefinition<'column'> {
    return {
        id: 'weather',
        name: 'Daily Weather',
        dataShape: 'column',
        tables: [
            {
                id: 'weather',
                name: 'Daily Weather',
                description:
                    'Daily weather observations, one row per city per day. Temperatures are in degrees Celsius and precipitation and snow in millimetres; a blank means the value was not recorded that day. Join cityId to the cities table for city attributes.',
                fields: weatherFields,
            },
        ],
        getData: async (_tableId, fieldIds) => ({
            data: await Promise.all(fieldIds.map((fieldId) => getWeatherColumn(baseUrl, fieldId))),
        }),
    };
}

const citiesByBaseUrl = new Map<string, Promise<Record<string, unknown>[]>>();
function loadCities(baseUrl: string): Promise<Record<string, unknown>[]> {
    let cities = citiesByBaseUrl.get(baseUrl);
    if (cities == null) {
        cities = fetch(`${baseUrl}/cities.json`).then((r) => r.json());
        citiesByBaseUrl.set(baseUrl, cities);
    }
    return cities;
}

function getCitiesSource(baseUrl: string): AgDataSourceDefinition<'row'> {
    return {
        id: 'cities',
        name: 'Cities',
        dataShape: 'row',
        tables: [
            {
                id: 'cities',
                name: 'Cities',
                description:
                    'One row per city: the dimension describing each city and the weather station backing it. Join cities.id to weather.cityId.',
                fields: cityFields,
            },
        ],
        getData: async () => ({ data: await loadCities(baseUrl) }),
    };
}

const relationships: AgRelationDefinition[] = [
    {
        id: 'weather-cities',
        source: { tableId: 'weather', fieldId: 'cityId' },
        target: { tableId: 'cities', fieldId: 'id' },
        type: 'many-to-one',
    },
    // Bind the observation date to a generated calendar (no date table needed) so
    // charts can group by `calendar::year`, `calendar::monthOfYear`, etc.
    {
        id: 'weather-calendar',
        source: { tableId: 'weather', fieldId: 'date' },
        target: { calendarId: 'calendar' },
    },
];

// A day counts as "frost"/"hot"/"wet" via a 0/1 calculated column; the matching
// measures below sum those flags. Comparing a null reading yields no count.
function dayFlag(fieldId: string, operator: 'lessThan' | 'greaterThanOrEqual', threshold: number) {
    return {
        operator: 'if' as const,
        inputs: [
            { operator, inputs: [{ id: fieldId }, { type: 'number' as const, value: threshold }] },
            { type: 'number' as const, value: 1 },
            { type: 'number' as const, value: 0 },
        ],
    };
}

const expressions: AgExpressionFieldDefinition[] = [
    // --- Calculated columns (row-level) ---
    {
        id: 'tempRange',
        name: 'Temp Range (°C)',
        description:
            'Daily temperature range (max temp minus min temp), in degrees Celsius. A large range suggests a continental or dry climate; a small range suggests a maritime one.',
        isMeasure: false,
        format: 'decimalFormat',
        expression: { operator: 'subtract', inputs: [{ id: 'weather.tmax' }, { id: 'weather.tmin' }] },
    },
    {
        id: 'isFrost',
        isMeasure: false,
        format: 'integerFormat',
        hide: true,
        expression: dayFlag('weather.tmin', 'lessThan', 0),
    },
    {
        id: 'isHot',
        isMeasure: false,
        format: 'integerFormat',
        hide: true,
        expression: dayFlag('weather.tmax', 'greaterThanOrEqual', 30),
    },
    {
        id: 'isWet',
        isMeasure: false,
        format: 'integerFormat',
        hide: true,
        expression: dayFlag('weather.prcp', 'greaterThanOrEqual', 1),
    },

    // --- Measures (aggregates over the grouped period) ---
    {
        id: 'avgHigh',
        name: 'Avg High (°C)',
        description: 'Average of the daily maximum temperatures over the grouped period, in degrees Celsius.',
        isMeasure: true,
        format: 'decimalFormat',
        expression: { id: 'weather.tmax', aggregation: 'avg' },
    },
    {
        id: 'avgLow',
        name: 'Avg Low (°C)',
        description: 'Average of the daily minimum temperatures over the grouped period, in degrees Celsius.',
        isMeasure: true,
        format: 'decimalFormat',
        expression: { id: 'weather.tmin', aggregation: 'avg' },
    },
    {
        id: 'avgTempRange',
        name: 'Avg Temp Range (°C)',
        description: 'Average daily temperature range (max minus min) over the grouped period, in degrees Celsius.',
        isMeasure: true,
        format: 'decimalFormat',
        expression: { id: 'tempRange', aggregation: 'avg' },
    },
    {
        id: 'totalRainfall',
        name: 'Total Rainfall (mm)',
        description: 'Total precipitation over the grouped period, in millimetres.',
        isMeasure: true,
        format: 'decimalFormat',
        expression: { id: 'weather.prcp', aggregation: 'sum' },
    },
    {
        id: 'totalSnowfall',
        name: 'Total Snowfall (mm)',
        description: 'Total fresh snowfall over the grouped period, in millimetres.',
        isMeasure: true,
        format: 'integerFormat',
        expression: { id: 'weather.snow', aggregation: 'sum' },
    },
    {
        id: 'frostDays',
        name: 'Frost Days',
        description: 'Number of days in the grouped period with a minimum temperature below 0°C.',
        isMeasure: true,
        format: 'integerFormat',
        expression: { id: 'isFrost', aggregation: 'sum' },
    },
    {
        id: 'hotDays',
        name: 'Hot Days (≥30°C)',
        description: 'Number of days in the grouped period with a maximum temperature of at least 30°C.',
        isMeasure: true,
        format: 'integerFormat',
        expression: { id: 'isHot', aggregation: 'sum' },
    },
    {
        id: 'wetDays',
        name: 'Wet Days (≥1mm)',
        description: 'Number of days in the grouped period with at least 1 mm of precipitation.',
        isMeasure: true,
        format: 'integerFormat',
        expression: { id: 'isWet', aggregation: 'sum' },
    },
];

export function getGhcnCitiesData(assetsBaseUrl: string): AgDataSourcesDefinition {
    const baseUrl = `${assetsBaseUrl}/ghcn-cities`;
    return {
        description:
            'Daily weather for 39 major world cities over roughly the last 100 years, from NOAA ' +
            'GHCN-Daily. The weather table has one row per city per day (max/min temperature in degrees ' +
            'Celsius, precipitation and snow in millimetres); a blank reading means it was not recorded. ' +
            'Each row joins via cityId to the cities dimension (city, country, region, climate band, ' +
            'coordinates and the backing station). The observation date is bound to a calendar, so results ' +
            'can be grouped or trended by year, quarter, month or month-of-year. Calculated fields add the ' +
            'daily temperature range; measures provide average high/low, average range, total ' +
            'rainfall/snowfall, and counts of frost days (min below 0°C), hot days (max at least 30°C) and ' +
            'wet days (at least 1 mm). Typical questions: compare cities or climate bands, show long-term ' +
            'temperature trends, or find the wettest or snowiest places.',
        sources: [getWeatherSource(baseUrl), getCitiesSource(baseUrl)],
        relationships,
        expressions,
        // Generated spine covering the ~100-year data window (see the generator's
        // --start-year). Keep `from`/`to` aligned with the data on each release refresh.
        calendars: [
            {
                id: 'calendar',
                label: 'Calendar',
                range: { from: { type: 'date', value: '1926-01-01' }, to: { type: 'date', value: '2026-12-31' } },
                fragments: ['year', 'quarter', 'month', 'monthOfYear', 'dayOfWeek'],
            },
        ],
    };
}
