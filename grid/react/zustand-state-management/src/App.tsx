import { BrowserRouter as Router } from "react-router-dom"
import GridComponent from "./components/GridComponent"
import Navigation from "./components/Navigation"

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <GridComponent />
      </div>
    </Router>
  )
}

export default App