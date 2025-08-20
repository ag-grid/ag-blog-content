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

async function getWeeklyDownloads(packageName, startYear = 2019) {
  const finalEndDate = new Date();
  finalEndDate.setDate(finalEndDate.getDate()); // Exclude last 7 days

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

    console.log(`Fetching data from ${startDateString} to ${endDateString}`);

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
    return { weeklyData: [], totalDownloads: 0 };
  }

  // Sort downloads by date to ensure proper order
  allDownloads.sort((a, b) => new Date(a.day) - new Date(b.day));

  // Group daily downloads into weekly buckets
  const weeklyData = [];
  let totalDownloads = 0;

  for (let i = 0; i < allDownloads.length; i += 7) {
    const weekDownloads = allDownloads.slice(i, i + 7);
    const weeklyTotal = weekDownloads.reduce(
      (sum, day) => sum + day.downloads,
      0
    );
    const weekStart = new Date(weekDownloads[0].day);
    const weekEnd = new Date(weekDownloads[weekDownloads.length - 1].day);

    totalDownloads += weeklyTotal;

    weeklyData.push({
      timestamp: weekStart.getTime(),
      downloads: weeklyTotal,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
    });
  }

  return { weeklyData, totalDownloads };
}

async function getData() {
  const packageName = 'ag-charts-community';
  const { weeklyData, totalDownloads } = await getWeeklyDownloads(
    packageName,
    2019
  );

  const chartData = weeklyData.map((item, index) => {
    // Calculate week-over-week growth (previous week)
    const previousWeek = index > 0 ? weeklyData[index - 1] : null;
    const weekOverWeekGrowth = previousWeek
      ? ((item.downloads - previousWeek.downloads) / previousWeek.downloads) *
        100
      : null;

    // Calculate year-over-year growth (52 weeks ago, approximately 1 year)
    const previousYear = index >= 52 ? weeklyData[index - 52] : null;
    const yearOverYearGrowth = previousYear
      ? ((item.downloads - previousYear.downloads) / previousYear.downloads) *
        100
      : null;

    return {
      timestamp: item.timestamp,
      price: item.downloads, // Using 'price' to match the chart configuration
      weekStart: item.weekStart,
      weekEnd: item.weekEnd,
      weekOverWeekGrowth: weekOverWeekGrowth,
      yearOverYearGrowth: yearOverYearGrowth,
      previousWeekDownloads: previousWeek ? previousWeek.downloads : null,
      previousYearDownloads: previousYear ? previousYear.downloads : null,
    };
  });

  return { data: chartData, totalDownloads };
}
