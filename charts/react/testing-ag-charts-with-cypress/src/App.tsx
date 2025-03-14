import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import BarChart from './components/BarChart';
import BoxPlot from './components/BoxPlot';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="navigation">
          <ul style={{ display: 'flex', listStyle: 'none', gap: '20px', padding: '20px', backgroundColor: '#f0f0f0' }}>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/bar-chart">Bar Chart</Link>
            </li>
            <li>
              <Link to="/box-plot">Box Plot</Link>
            </li>
          </ul>
        </nav>

        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={
              <div>
                <h1>Analytics Dashboard</h1>
                <p>Select a chart type from the navigation menu</p>
              </div>
            } />
            <Route path="/bar-chart" element={<BarChart />} />
            <Route path="/box-plot" element={<BoxPlot />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;