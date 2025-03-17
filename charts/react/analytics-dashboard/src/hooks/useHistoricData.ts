import { useState, useEffect } from 'react';

interface StockData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface UseStockDataResult {
  data: StockData[];
  isLoading: boolean;
  error: string | null;
}

const useHistoricData = (
  ticker: string, 
  days: number = 30
): UseStockDataResult => {
  const [data, setData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!ticker) {
        setError('Ticker symbol is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const apiKey = import.meta.env.VITE_FMP_API_KEY;
        const today = new Date();

        const BASE_URL = 
          `https://financialmodelingprep.com/api/v3/historical-price-full/`;
        
        // Calculate date 'days' ago
        const fromDate = new Date();
        fromDate.setDate(today.getDate() - days);
        
        const formattedFromDate = fromDate.toISOString().split('T')[0];
        const formattedToDate = today.toISOString().split('T')[0];
        
        const url = `
          ${BASE_URL}
          ${ticker}?from=${formattedFromDate}&to=${formattedToDate}&apikey=${apiKey}
        `;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.historical || result.historical.length === 0) {
          throw new Error('No historical data available');
        }
        
        // Format the data for the chart
        const formattedData = result.historical.map((item: any) => ({
          date: new Date(item.date),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        })).reverse(); // Reverse to show oldest to newest
        
        setData(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching historical data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [ticker, days]);

  return { data, isLoading, error };
};

export default useHistoricData;
export type { StockData };