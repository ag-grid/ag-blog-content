import { useState, useEffect } from 'react';

/**
 * Stock quote data structure from Financial Modeling Prep API
 */
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

/**
 * Options for the useStockQuote hook
 */
interface UseStockQuoteOptions {
  /** Whether to fetch automatically on mount (default: true) */
  autoFetch?: boolean;
}

/**
 * Return type for the useStockQuote hook
 */
interface UseStockQuoteReturn {
  /** Stock quote data (null if not yet loaded) */
  data: StockQuote[] | null;
  /** Whether data is currently being fetched */
  loading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Function to manually trigger a refetch */
  refetch: () => Promise<StockQuote[] | null>;
}

/**
 * Custom hook to fetch stock quotes from Financial Modeling Prep API
 * @param tickers - Single ticker or array of ticker symbols
 * @param options - Additional options for the hook
 * @returns Object containing data, loading state, error state, and refetch function
 */
export const useStockQuote = (
  tickers: string | string[],
  options: UseStockQuoteOptions = {}
): UseStockQuoteReturn => {
  const { autoFetch = true } = options;
  const [data, setData] = useState<StockQuote[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Format tickers to handle both string and array inputs
  const formattedTickers = Array.isArray(tickers) ? tickers.join(',') : tickers;

  const baseURL = "https://financialmodelingprep.com/api/v3/quote/";

  const fetchQuotes = async (): Promise<StockQuote[] | null> => {
    if (!formattedTickers) {
      const newError = new Error('No ticker symbols provided');
      setError(newError);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${baseURL}${formattedTickers}?apikey=${import.meta.env.VITE_FMP_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json() as StockQuote[];
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && formattedTickers) {
      fetchQuotes();
    }
  }, [formattedTickers, autoFetch]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchQuotes 
  };
};