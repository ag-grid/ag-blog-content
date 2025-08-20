async function fetchNpmDownloads(packageName, startDate, endDate) {
  const url = `https://api.npmjs.org/downloads/range/${startDate}:${endDate}/${packageName}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching npm downloads:', error);
    return null;
  }
}

async function getMonthlyDownloads(packageName, startYear = 2020) {
  // Set end date to the last day of the previous month
  const finalEndDate = new Date();
  finalEndDate.setDate(0); // Sets to last day of previous month

  const allDownloads = [];
  let currentStart = new Date(`${startYear}-01-01`);

  // Fetch data in 17-month chunks (staying under 18-month limit)
  while (currentStart < finalEndDate) {
    const chunkEnd = new Date(currentStart);
    chunkEnd.setMonth(chunkEnd.getMonth() + 17); // 17 months chunk

    // Don't go beyond our target end date
    if (chunkEnd > finalEndDate) {
      chunkEnd.setTime(finalEndDate.getTime());
    }

    const startDateString = currentStart.toISOString().split('T')[0];
    const endDateString = chunkEnd.toISOString().split('T')[0];

    const data = await fetchNpmDownloads(
      packageName,
      startDateString,
      endDateString
    );

    if (data && data.downloads) {
      allDownloads.push(...data.downloads);
    }

    // Move to next chunk (add 1 day to avoid overlap)
    currentStart = new Date(chunkEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  if (allDownloads.length === 0) {
    console.error('No download data available');
    return { monthlyData: [], totalDownloads: 0 };
  }

  // Sort downloads by date to ensure proper order
  allDownloads.sort((a, b) => new Date(a.day) - new Date(b.day));

  // Group daily downloads into monthly buckets
  const monthlyData = [];
  let totalDownloads = 0;

  // Group by month
  const monthlyGroups = {};

  for (const day of allDownloads) {
    const date = new Date(day.day);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}`;

    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = {
        downloads: 0,
        days: [],
        year: date.getFullYear(),
        month: date.getMonth(),
      };
    }

    monthlyGroups[monthKey].downloads += day.downloads;
    monthlyGroups[monthKey].days.push(day.day);
    totalDownloads += day.downloads;
  }

  // Convert to array and sort
  for (const [, data] of Object.entries(monthlyGroups)) {
    const monthStart = new Date(data.year, data.month, 1);
    const monthEnd = new Date(data.year, data.month + 1, 0);

    monthlyData.push({
      timestamp: monthStart.getTime(),
      downloads: data.downloads,
      monthStart: monthStart.toISOString().split('T')[0],
      monthEnd: monthEnd.toISOString().split('T')[0],
      year: data.year,
      month: data.month + 1
    });
  }

  // Sort by timestamp
  monthlyData.sort((a, b) => a.timestamp - b.timestamp);

  return { monthlyData, totalDownloads };
}

async function getData() {
  const packageName = 'ag-charts-community';
  const { monthlyData, totalDownloads } = await getMonthlyDownloads(
    packageName,
    2020
  );

  const chartData = monthlyData.map((item, index) => {
    // Calculate month-over-month growth (previous month)
    const previousMonth = index > 0 ? monthlyData[index - 1] : null;
    const monthOverMonthGrowth = previousMonth
      ? ((item.downloads - previousMonth.downloads) / previousMonth.downloads) *
        100
      : null;

    // Calculate year-over-year growth (12 months ago)
    const previousYear = index >= 12 ? monthlyData[index - 12] : null;
    const yearOverYearGrowth = previousYear
      ? ((item.downloads - previousYear.downloads) / previousYear.downloads) *
        100
      : null;

    return {
      timestamp: item.timestamp,
      price: item.downloads, // Using 'price' to match the chart configuration
      monthStart: item.monthStart,
      monthEnd: item.monthEnd,
      year: item.year,
      month: item.month,
      monthOverMonthGrowth: monthOverMonthGrowth,
      yearOverYearGrowth: yearOverYearGrowth,
      previousMonthDownloads: previousMonth ? previousMonth.downloads : null,
      previousYearDownloads: previousYear ? previousYear.downloads : null,
    };
  });

  return { data: chartData, totalDownloads };
}
