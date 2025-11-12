import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaRobot, FaFileAlt, FaChartLine, FaCalculator, FaStore } from 'react-icons/fa'
import './Navbar.css'

const Navbar = () => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🏡</span>
          <span className="logo-text">Ropani AI</span>
        </Link>
        
        <ul className="navbar-menu">
          <li>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <FaHome /> <span>Home</span>
            </Link>
          </li>
          <li>
            <Link to="/chatbot" className={`nav-link ${isActive('/chatbot') ? 'active' : ''}`}>
              <FaRobot /> <span>AI Chatbot</span>
            </Link>
          </li>
          <li>
            <Link to="/marketplace" className={`nav-link ${isActive('/marketplace') ? 'active' : ''}`}>
              <FaStore /> <span>Marketplace</span>
            </Link>
          </li>
          <li>
            <Link to="/ocr-form" className={`nav-link ${isActive('/ocr-form') ? 'active' : ''}`}>
              <FaFileAlt /> <span>OCR Form</span>
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              <FaChartLine /> <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/price-predictor" className={`nav-link ${isActive('/price-predictor') ? 'active' : ''}`}>
              <FaCalculator /> <span>Price Predictor</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
