import { useState, useEffect } from "react";
import { AgFinancialCharts } from "ag-charts-react";
import { AgFinancialChartOptions } from "ag-charts-enterprise";
import useIntradayPrices from "../hooks/useIntradayPrices";
import "ag-charts-enterprise";

interface DailyPriceProps {
  ticker: string;
}

const DailyPrice = ({ ticker }: DailyPriceProps) => {
  const { prices, loading, error } = useIntradayPrices(ticker, "5min");

  const [options, setOptions] = useState<AgFinancialChartOptions>({
    title: { text: "Intraday Financial Line Chart" },
    data: [],
    rangeButtons: false,
    statusBar: false,
    volume: false,
    chartType: "line"
  });

  useEffect(() => {
    const formattedPrices = prices.map(price => ({
      ...price,
      date: new Date(price.date),
    }));

    setOptions(prevOptions => ({
      ...prevOptions,
      data: formattedPrices,
    }));
  }, [prices]);

  if (!ticker) {
    return <div>Please select a ticker</div>;
  }

  if (loading) return <div>Loading chart...</div>;
  if (error) return <div>Error loading chart: {error}</div>;

  return (
    <div style={{ width: "100%" }}>
      <AgFinancialCharts options={options} />
    </div>
  );
};

export default DailyPrice;
