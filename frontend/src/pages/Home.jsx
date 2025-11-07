import { Link } from 'react-router-dom'
import { FaRobot, FaFileAlt, FaChartLine, FaCalculator, FaStore } from 'react-icons/fa'
import './Home.css'

const Home = () => {
  const features = [
    {
      icon: <FaRobot />,
      title: 'AI Chatbot',
      description: 'Ask questions about land documents and get instant, intelligent answers powered by RAG technology.',
      link: '/chatbot',
      color: '#667eea'
    },
    {
      icon: <FaStore />,
      title: 'Land Marketplace',
      description: 'Browse, list, and buy land properties across all 77 districts of Nepal with AI price suggestions.',
      link: '/marketplace',
      color: '#f093fb'
    },
    {
      icon: <FaFileAlt />,
      title: 'OCR Document Scanner',
      description: 'Upload land documents and extract information automatically using advanced OCR technology.',
      link: '/ocr-form',
      color: '#4facfe'
    },
    {
      icon: <FaChartLine />,
      title: 'Price Dashboard',
      description: 'Visualize land prices across different municipalities in Nepal with interactive charts.',
      link: '/dashboard',
      color: '#43e97b'
    },
    {
      icon: <FaCalculator />,
      title: 'Price Predictor',
      description: 'Get accurate land price predictions using our ML model trained on real market data.',
      link: '/price-predictor',
      color: '#f093fb'
    }
  ]

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="gradient-text">Ropani AI</span>
            </h1>
            <p className="hero-subtitle">
              AI-Powered Land Selling Platform for Nepal
            </p>
            <p className="hero-description">
              Buy and sell land with confidence using our intelligent chatbot, automated document processing,
              real-time market insights, and ML-powered price predictions.
            </p>
            <div className="hero-actions">
              <Link to="/chatbot" className="btn btn-primary">
                Start Chatting
              </Link>
              <Link to="/dashboard" className="btn btn-secondary">
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Our Features</h2>
          <p className="section-subtitle">
            Everything you need to make informed land selling decisions
          </p>
          <div className="features-grid">
            {features.map((feature, index) => (
              <Link to={feature.link} key={index} className="feature-card" style={{ '--card-color': feature.color }}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="about-content">
            <h2 className="section-title">Why Choose Ropani AI?</h2>
            <div className="about-grid">
              <div className="about-item">
                <h3>🤖 Intelligent Assistant</h3>
                <p>Our RAG-powered chatbot understands your land documents and provides accurate, context-aware answers.</p>
              </div>
              <div className="about-item">
                <h3>📄 Smart Document Processing</h3>
                <p>OCR technology automatically extracts key information from your land ownership documents.</p>
              </div>
              <div className="about-item">
                <h3>📊 Data-Driven Insights</h3>
                <p>Real-time visualization of land prices across Nepal's municipalities helps you make informed decisions.</p>
              </div>
              <div className="about-item">
                <h3>💰 Accurate Predictions</h3>
                <p>ML algorithms trained on historical data provide reliable land price estimates.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
