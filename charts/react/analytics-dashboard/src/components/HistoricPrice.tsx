import { useEffect, useState } from "react";
import "ag-charts-enterprise";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-enterprise";
import useStockData, { StockData } from "../hooks/useHistoricData";

interface HistoricPriceChartProps {
  ticker: string;
}

const HistoricPriceChart = ({ ticker }: HistoricPriceChartProps) => {
  const { data } = useStockData(ticker);
  
  const [options, setOptions] = useState<AgChartOptions>({
    data: [],
    title: {
      text: `${ticker} Stock Price`,
    },
    subtitle: {
      text: `Daily High and Low Prices (Last 30 Days)`,
    },
    series: [
      {
        type: "candlestick",
        xKey: "date",
        xName: "Date",
        lowKey: "low",
        highKey: "high",
        openKey: "open",
        closeKey: "close",
      },
    ],
    legend: { enabled: false },
  });

  useEffect(() => {
    setOptions({
      data: data,
      title: {
        text: `${ticker} Stock Price`,
      },
      subtitle: {
        text: `Daily High and Low Prices (Last 30 Days)`,
      },
      series: [
        {
          type: "candlestick",
          xKey: "date",
          xName: "Date",
          lowKey: "low",
          highKey: "high",
          openKey: "open",
          closeKey: "close",
        },
      ],
      legend: { enabled: false },
    });
  }, [data, ticker]);

	if (!ticker) {
		return null;
	}

  return (
		<div style={{ width: "100%" }}>
			<AgCharts options={options} />
		</div>
	);
};

export default HistoricPriceChart;