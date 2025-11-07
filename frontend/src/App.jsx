import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Chatbot from './pages/Chatbot'
import OCRForm from './pages/OCRForm'
import Dashboard from './pages/Dashboard'
import PricePredictor from './pages/PricePredictor'
import LandMarketplace from './pages/LandMarketplace'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/ocr-form" element={<OCRForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/price-predictor" element={<PricePredictor />} />
          <Route path="/marketplace" element={<LandMarketplace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
