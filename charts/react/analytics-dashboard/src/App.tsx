import { useStockQuote } from './hooks/useStockQuote';
import stocks from "../stocks.json";

function App() {
  const tickers = stocks.map((stock) => stock.ticker).join(",");
  const { data, loading, error, refetch } = useStockQuote(tickers);

  if (loading) return <p>Loading...</p>;

  if (error) return <p>Error: {error.message}</p>;

  console.log(data);

  return (
    <>
      <div>Test</div>
    </>
  )
}

export default App