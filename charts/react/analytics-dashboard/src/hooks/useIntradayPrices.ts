import { useEffect, useState } from 'react';

interface IntradayPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const useIntradayPrices = (
  symbol: string,
  interval: '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour'
) => {
  const [prices, setPrices] = useState<IntradayPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      setError(null);

      const BASE_URL = 'https://financialmodelingprep.com/api/v3/historical-chart/';

      try {
        const res = await fetch(
          `
      ${BASE_URL}${interval}/
      ${symbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}
      `
        );

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data: IntradayPrice[] = await res.json();

        const now = new Date();
        const hoursAgo24 = new Date(now.getTime() - 72 * 60 * 60 * 1000);

        const filteredData = 
          data.filter((entry) => new Date(entry.date) > hoursAgo24);

        setPrices(filteredData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [symbol, interval]);

  return { prices, loading, error };
};

export default useIntradayPrices;
