import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import Navigation from "./components/Navigation"
import SecondaryPage from "./pages/Secondary"
import Home from "./pages/Home"

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/secondary" element={<SecondaryPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App