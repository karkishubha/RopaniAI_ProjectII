import React, { useState } from 'react';
import './PricePredictor.css';
import { FaCalculator, FaMapMarkerAlt, FaRuler, FaRoad, FaHome, FaCheckCircle } from 'react-icons/fa';

const PricePredictor = () => {
  const [formData, setFormData] = useState({
    municipality: 'Kathmandu',
    ward: '',
    area: '',
    unit: 'aana',
    roadAccess: 'yes',
    roadWidth: '10',
    landType: 'residential',
    facilities: {
      water: false,
      electricity: false,
      drainage: false,
      internet: false
    }
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const municipalities = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Butwal', 'Biratnagar'];
  const landTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'agricultural', label: 'Agricultural' },
    { value: 'industrial', label: 'Industrial' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFacilityChange = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [facility]: !prev.facilities[facility]
      }
    }));
  };

  const calculatePrice = () => {
    setLoading(true);
    
    // Mock ML prediction - replace with actual API call
    setTimeout(() => {
      const basePrice = {
        'Kathmandu': 50000,
        'Lalitpur': 48000,
        'Bhaktapur': 43000,
        'Pokhara': 38000,
        'Butwal': 32000,
        'Biratnagar': 35000
      }[formData.municipality];

      const typeMultiplier = {
        'residential': 1.0,
        'commercial': 1.5,
        'agricultural': 0.4,
        'industrial': 1.2
      }[formData.landType];

      const roadMultiplier = formData.roadAccess === 'yes' ? 
        (1 + (parseInt(formData.roadWidth) / 100)) : 0.7;

      const facilitiesCount = Object.values(formData.facilities).filter(Boolean).length;
      const facilityMultiplier = 1 + (facilitiesCount * 0.05);

      const pricePerUnit = Math.round(basePrice * typeMultiplier * roadMultiplier * facilityMultiplier);
      const totalArea = parseFloat(formData.area);
      const totalPrice = pricePerUnit * totalArea;

      const confidence = 75 + Math.random() * 20; // 75-95% confidence

      setPrediction({
        pricePerUnit,
        totalPrice,
        confidence: confidence.toFixed(1),
        factors: {
          location: basePrice,
          type: (typeMultiplier * 100 - 100).toFixed(0),
          road: ((roadMultiplier - 1) * 100).toFixed(0),
          facilities: ((facilityMultiplier - 1) * 100).toFixed(0)
        }
      });
      setLoading(false);
    }, 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.area && formData.ward) {
      calculatePrice();
    }
  };

  const resetForm = () => {
    setFormData({
      municipality: 'Kathmandu',
      ward: '',
      area: '',
      unit: 'aana',
      roadAccess: 'yes',
      roadWidth: '10',
      landType: 'residential',
      facilities: {
        water: false,
        electricity: false,
        drainage: false,
        internet: false
      }
    });
    setPrediction(null);
  };

  return (
    <div className="predictor-page">
      <div className="predictor-container">
        <div className="predictor-header">
          <h1>🔮 Land Price Predictor</h1>
          <p>Get AI-powered price predictions for your land based on multiple factors</p>
        </div>

        <div className="predictor-content">
          {/* Input Form */}
          <div className="form-section">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  <FaMapMarkerAlt className="label-icon" />
                  Municipality
                </label>
                <select 
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  className="input-select"
                >
                  {municipalities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FaHome className="label-icon" />
                  Ward Number
                </label>
                <input
                  type="number"
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  placeholder="Enter ward number"
                  className="input-field"
                  required
                  min="1"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>
                    <FaRuler className="label-icon" />
                    Land Area
                  </label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="Enter area"
                    className="input-field"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div className="form-group" style={{ maxWidth: '140px' }}>
                  <label>Unit</label>
                  <select 
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="input-select"
                  >
                    <option value="aana">Aana</option>
                    <option value="ropani">Ropani</option>
                    <option value="bigha">Bigha</option>
                    <option value="sqft">Sq. Ft.</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Land Type</label>
                <div className="radio-group">
                  {landTypes.map(type => (
                    <label key={type.value} className="radio-label">
                      <input
                        type="radio"
                        name="landType"
                        value={type.value}
                        checked={formData.landType === type.value}
                        onChange={handleInputChange}
                      />
                      <span>{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <FaRoad className="label-icon" />
                  Road Access
                </label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="roadAccess"
                      value="yes"
                      checked={formData.roadAccess === 'yes'}
                      onChange={handleInputChange}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="roadAccess"
                      value="no"
                      checked={formData.roadAccess === 'no'}
                      onChange={handleInputChange}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {formData.roadAccess === 'yes' && (
                <div className="form-group">
                  <label>Road Width (feet)</label>
                  <select 
                    name="roadWidth"
                    value={formData.roadWidth}
                    onChange={handleInputChange}
                    className="input-select"
                  >
                    <option value="5">5 feet</option>
                    <option value="10">10 feet</option>
                    <option value="13">13 feet</option>
                    <option value="20">20 feet</option>
                    <option value="25">25+ feet</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Available Facilities</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.facilities.water}
                      onChange={() => handleFacilityChange('water')}
                    />
                    <span>💧 Water Supply</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.facilities.electricity}
                      onChange={() => handleFacilityChange('electricity')}
                    />
                    <span>⚡ Electricity</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.facilities.drainage}
                      onChange={() => handleFacilityChange('drainage')}
                    />
                    <span>🚰 Drainage System</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.facilities.internet}
                      onChange={() => handleFacilityChange('internet')}
                    />
                    <span>📡 Internet</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-predict" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <FaCalculator />
                      Predict Price
                    </>
                  )}
                </button>
                <button type="button" className="btn-reset" onClick={resetForm}>
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Prediction Result */}
          {prediction && (
            <div className="result-section">
              <div className="result-header">
                <FaCheckCircle className="success-icon" />
                <div>
                  <h2>Price Prediction</h2>
                  <p>Based on our ML model analysis</p>
                </div>
              </div>

              <div className="price-display">
                <div className="price-main">
                  <p className="price-label">Estimated Price per {formData.unit}</p>
                  <h3 className="price-value">NPR {prediction.pricePerUnit.toLocaleString()}</h3>
                </div>
                <div className="price-total">
                  <p className="price-label">Total Estimated Value</p>
                  <h3 className="price-value-total">NPR {prediction.totalPrice.toLocaleString()}</h3>
                </div>
              </div>

              <div className="confidence-bar">
                <div className="confidence-label">
                  <span>Prediction Confidence</span>
                  <span className="confidence-value">{prediction.confidence}%</span>
                </div>
                <div className="confidence-track">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
              </div>

              <div className="factors-section">
                <h3>Price Influencing Factors</h3>
                <div className="factors-grid">
                  <div className="factor-item">
                    <span className="factor-label">📍 Location Base</span>
                    <span className="factor-value">NPR {prediction.factors.location.toLocaleString()}</span>
                  </div>
                  <div className="factor-item">
                    <span className="factor-label">🏢 Land Type</span>
                    <span className={`factor-value ${prediction.factors.type >= 0 ? 'positive' : 'negative'}`}>
                      {prediction.factors.type >= 0 ? '+' : ''}{prediction.factors.type}%
                    </span>
                  </div>
                  <div className="factor-item">
                    <span className="factor-label">🛣️ Road Access</span>
                    <span className={`factor-value ${prediction.factors.road >= 0 ? 'positive' : 'negative'}`}>
                      {prediction.factors.road >= 0 ? '+' : ''}{prediction.factors.road}%
                    </span>
                  </div>
                  <div className="factor-item">
                    <span className="factor-label">⚙️ Facilities</span>
                    <span className="factor-value positive">+{prediction.factors.facilities}%</span>
                  </div>
                </div>
              </div>

              <div className="disclaimer">
                <p><strong>Note:</strong> This is an AI-generated estimate based on available data. Actual prices may vary based on market conditions, exact location, and other factors. Please consult with real estate professionals for accurate valuation.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricePredictor;
