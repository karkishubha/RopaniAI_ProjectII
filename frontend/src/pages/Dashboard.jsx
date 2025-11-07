import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';
import { FaChartLine, FaMapMarkerAlt, FaCalendarAlt, FaArrowUp } from 'react-icons/fa';

// Mock data for different municipalities
const priceData = {
  'Kathmandu': [
    { month: 'Jan', price: 45000, transactions: 120 },
    { month: 'Feb', price: 46500, transactions: 135 },
    { month: 'Mar', price: 47800, transactions: 148 },
    { month: 'Apr', price: 49200, transactions: 162 },
    { month: 'May', price: 50100, transactions: 178 },
    { month: 'Jun', price: 51500, transactions: 195 },
  ],
  'Lalitpur': [
    { month: 'Jan', price: 42000, transactions: 95 },
    { month: 'Feb', price: 43200, transactions: 102 },
    { month: 'Mar', price: 44500, transactions: 118 },
    { month: 'Apr', price: 46000, transactions: 128 },
    { month: 'May', price: 47200, transactions: 142 },
    { month: 'Jun', price: 48500, transactions: 155 },
  ],
  'Bhaktapur': [
    { month: 'Jan', price: 38000, transactions: 75 },
    { month: 'Feb', price: 38900, transactions: 82 },
    { month: 'Mar', price: 39800, transactions: 91 },
    { month: 'Apr', price: 41200, transactions: 98 },
    { month: 'May', price: 42300, transactions: 105 },
    { month: 'Jun', price: 43600, transactions: 118 },
  ],
  'Pokhara': [
    { month: 'Jan', price: 32000, transactions: 68 },
    { month: 'Feb', price: 33100, transactions: 72 },
    { month: 'Mar', price: 34200, transactions: 79 },
    { month: 'Apr', price: 35500, transactions: 85 },
    { month: 'May', price: 36800, transactions: 92 },
    { month: 'Jun', price: 38200, transactions: 101 },
  ],
};

const landUseData = [
  { name: 'Residential', value: 45, color: '#667eea' },
  { name: 'Commercial', value: 30, color: '#764ba2' },
  { name: 'Agricultural', value: 15, color: '#48bb78' },
  { name: 'Industrial', value: 10, color: '#ed8936' },
];

const Dashboard = () => {
  const [selectedMunicipality, setSelectedMunicipality] = useState('Kathmandu');
  const municipalities = Object.keys(priceData);
  const currentData = priceData[selectedMunicipality];
  
  // Calculate statistics
  const latestPrice = currentData[currentData.length - 1].price;
  const previousPrice = currentData[currentData.length - 2].price;
  const priceChange = ((latestPrice - previousPrice) / previousPrice * 100).toFixed(2);
  const avgPrice = (currentData.reduce((sum, item) => sum + item.price, 0) / currentData.length).toFixed(0);
  const totalTransactions = currentData.reduce((sum, item) => sum + item.transactions, 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>📊 Land Price Dashboard</h1>
            <p>Real-time land price analytics and trends across Nepal</p>
          </div>
          <div className="location-selector">
            <FaMapMarkerAlt className="selector-icon" />
            <select 
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              className="municipality-select"
            >
              {municipalities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#667eea' }}>
              <FaArrowUp />
            </div>
            <div className="stat-content">
              <p className="stat-label">Current Price</p>
              <h3 className="stat-value">NPR {latestPrice.toLocaleString()}</h3>
              <p className={`stat-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange)}% from last month
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#48bb78' }}>
              <FaChartLine />
            </div>
            <div className="stat-content">
              <p className="stat-label">Average Price (6 months)</p>
              <h3 className="stat-value">NPR {parseInt(avgPrice).toLocaleString()}</h3>
              <p className="stat-info">Per Aana residential land</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ed8936' }}>
              <FaCalendarAlt />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Transactions</p>
              <h3 className="stat-value">{totalTransactions}</h3>
              <p className="stat-info">Last 6 months</p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Price Trend Chart */}
          <div className="chart-card large">
            <div className="chart-header">
              <h2>Price Trend - {selectedMunicipality}</h2>
              <p>Land price per Aana (NPR) over the last 6 months</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ fill: '#667eea', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Price (NPR)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Transactions Chart */}
          <div className="chart-card large">
            <div className="chart-header">
              <h2>Transaction Volume</h2>
              <p>Number of land transactions by month</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend />
                <Bar 
                  dataKey="transactions" 
                  fill="#48bb78" 
                  radius={[8, 8, 0, 0]}
                  name="Transactions"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Land Use Distribution */}
          <div className="chart-card">
            <div className="chart-header">
              <h2>Land Use Distribution</h2>
              <p>Breakdown by land type</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={landUseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {landUseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Price Comparison */}
          <div className="chart-card">
            <div className="chart-header">
              <h2>City Price Comparison</h2>
              <p>Current prices across cities</p>
            </div>
            <div className="comparison-list">
              {municipalities.map((city, index) => {
                const cityData = priceData[city];
                const cityPrice = cityData[cityData.length - 1].price;
                const maxPrice = Math.max(...municipalities.map(c => 
                  priceData[c][priceData[c].length - 1].price
                ));
                const percentage = (cityPrice / maxPrice) * 100;

                return (
                  <div key={city} className="comparison-item">
                    <div className="comparison-info">
                      <span className="comparison-rank">#{index + 1}</span>
                      <span className="comparison-city">{city}</span>
                    </div>
                    <div className="comparison-bar-container">
                      <div 
                        className="comparison-bar" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="comparison-price">
                      NPR {cityPrice.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="insights-section">
          <h2>📈 Market Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h3>Trending Up</h3>
              <p>Kathmandu Valley continues to show strong growth with an average increase of 3.2% per month in Q1 2024.</p>
            </div>
            <div className="insight-card">
              <h3>High Demand</h3>
              <p>Residential land in Lalitpur metropolitan area is seeing increased demand, with transactions up by 28%.</p>
            </div>
            <div className="insight-card">
              <h3>Investment Zone</h3>
              <p>Pokhara emerging as a lucrative investment destination with steady 2.8% monthly growth rate.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
