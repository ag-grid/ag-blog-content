import { useStockQuote } from './hooks/useStockQuote';
import stocks from "../stocks.json";
import StockTable from './components/StockTable';
import { useState } from 'react';
import HistoricPriceChart from './components/HistoricPrice';

function App() {

  const tickers = stocks.map((stock) => stock.ticker).join(",");
  const { data, loading, error, refetch } = useStockQuote(tickers);
  const [ticker, setTicker] = useState<string>("");

  if (loading) return <p>Loading...</p>;

  if (error) return <p>Error: {error.message}</p>;
  

  // This calculation can be done in the backend in a real-world application
  const stocksWithBuyPrice = stocks.map((stock) => {
    const currentStock = data?.find(
      (item) => item.symbol === stock.ticker
    );
    return {
      ...stock,
      current_price: currentStock?.price || 0,
    };
  });

  const selectTicker = (ticker: string) => {
    setTicker(ticker);
  };

  return (
    <>
      <HistoricPriceChart ticker={ticker} />
      <StockTable 
        stocks={stocksWithBuyPrice} 
        onTickerSelect={selectTicker}
      />
    </>
  )
}

export default App
