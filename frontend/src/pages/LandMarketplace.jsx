import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaFilter, FaMapMarkerAlt, FaRulerCombined, 
  FaMoneyBillWave, FaFileAlt, FaPhone, FaEnvelope, 
  FaArrowUp, FaArrowDown, FaCheckCircle, FaTimesCircle,
  FaHome, FaRoad, FaWater, FaTint, FaBolt, FaTree, FaImage, FaCamera
} from 'react-icons/fa';
import './LandMarketplace.css';
import { getAllDistricts, getMunicipalities, getDistrictsByProvince } from '../data/nepaliDistricts';
import marketplaceService from '../services/marketplaceAPI';
import PhotoUpload from '../components/PhotoUpload';
import DocumentUpload from '../components/DocumentUpload';

const LandMarketplace = () => {
  const [viewMode, setViewMode] = useState('buyer'); // 'buyer' or 'seller'
  const [lands, setLands] = useState([]);
  const [filteredLands, setFilteredLands] = useState([]);
  const [selectedLand, setSelectedLand] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showListingForm, setShowListingForm] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    province: '',
    district: '',
    municipality: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    roadAccess: false,
    waterSupply: false,
    electricity: false,
    residentialZone: false,
    commercialZone: false,
    agriculturalZone: false,
  });

  // Listing form states
  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    province: '',
    district: '',
    municipality: '',
    ward: '',
    area: '',
    areaUnit: 'aana',
    pricePerUnit: '',
    roadAccess: false,
    roadWidth: '',
    waterSupply: false,
    electricity: false,
    residentialZone: false,
    commercialZone: false,
    agriculturalZone: false,
    kitta: '',
    plotNumber: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    documents: {
      landOwnershipCertificate: false,
      taxClearanceCertificate: false,
      characterCertificate: false,
      cadastralMap: false,
      noObjectionCertificate: false,
    }
  });

  const provinces = getDistrictsByProvince();
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdListingId, setCreatedListingId] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  
  // Photo states for pre-upload
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // OCR states
  const [ocrExtractedData, setOcrExtractedData] = useState(null);
  const [showOcrPreview, setShowOcrPreview] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  // Fetch listings from API
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketplaceService.getListings();
      const normalizedData = data.map(normalizeListingData);
      setLands(normalizedData);
      setFilteredLands(normalizedData);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update available districts when province changes
  useEffect(() => {
    if (filters.province) {
      setAvailableDistricts(provinces[filters.province] || []);
      setFilters(prev => ({ ...prev, district: '', municipality: '' }));
    }
  }, [filters.province]);

  useEffect(() => {
    if (listingForm.province) {
      setAvailableDistricts(provinces[listingForm.province] || []);
      setListingForm(prev => ({ ...prev, district: '', municipality: '' }));
    }
  }, [listingForm.province]);

  // Update available municipalities when district changes
  useEffect(() => {
    if (filters.district) {
      setAvailableMunicipalities(getMunicipalities(filters.district));
      setFilters(prev => ({ ...prev, municipality: '' }));
    }
  }, [filters.district]);

  useEffect(() => {
    if (listingForm.district) {
      setAvailableMunicipalities(getMunicipalities(listingForm.district));
      setListingForm(prev => ({ ...prev, municipality: '' }));
    }
  }, [listingForm.district]);

  // Apply filters
  useEffect(() => {
    let filtered = [...lands];

    if (filters.province) {
      filtered = filtered.filter(land => land.province === filters.province);
    }
    if (filters.district) {
      filtered = filtered.filter(land => land.district === filters.district);
    }
    if (filters.municipality) {
      filtered = filtered.filter(land => land.municipality === filters.municipality);
    }
    if (filters.minPrice) {
      filtered = filtered.filter(land => land.currentPrice >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(land => land.currentPrice <= parseFloat(filters.maxPrice));
    }
    if (filters.minArea) {
      filtered = filtered.filter(land => land.area >= parseFloat(filters.minArea));
    }
    if (filters.maxArea) {
      filtered = filtered.filter(land => land.area <= parseFloat(filters.maxArea));
    }
    if (filters.roadAccess) {
      filtered = filtered.filter(land => land.roadAccess);
    }
    if (filters.waterSupply) {
      filtered = filtered.filter(land => land.waterSupply);
    }
    if (filters.electricity) {
      filtered = filtered.filter(land => land.electricity);
    }
    if (filters.residentialZone) {
      filtered = filtered.filter(land => land.residentialZone);
    }
    if (filters.commercialZone) {
      filtered = filtered.filter(land => land.commercialZone);
    }
    if (filters.agriculturalZone) {
      filtered = filtered.filter(land => land.agriculturalZone);
    }

    setFilteredLands(filtered);
  }, [filters, lands]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleListingFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setListingForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDocumentChange = (docName) => {
    setListingForm(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docName]: !prev.documents[docName]
      }
    }));
  };

  // Photo handling functions
  const handlePhotoSelect = (event) => {
    const files = Array.from(event.target.files);
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    files.forEach(file => {
      if (file.size > MAX_SIZE) {
        alert(`${file.name} is too large. Maximum size is 5MB.`);
        return;
      }
      
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`${file.name} is not a supported format. Use JPEG, PNG, or WebP.`);
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingPhotos(prev => [...prev, {
          file: file,
          preview: reader.result,
          caption: '',
          isPrimary: prev.length === 0 // First photo is primary by default
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    event.target.value = '';
  };

  const handleRemovePendingPhoto = (index) => {
    setPendingPhotos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the primary photo, make the first one primary
      if (prev[index].isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const handleSetPrimaryPending = (index) => {
    setPendingPhotos(prev => prev.map((photo, i) => ({
      ...photo,
      isPrimary: i === index
    })));
  };

  const handlePhotoCaptionChange = (index, caption) => {
    setPendingPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, caption } : photo
    ));
  };

  const handlePriceAdjustment = async (landId, adjustment) => {
    try {
      const result = await marketplaceService.adjustPrice(landId, adjustment);
      
      // Update local state
      setLands(prevLands => 
        prevLands.map(land => {
          if (land.id === landId) {
            return { ...land, current_price: result.new_price };
          }
          return land;
        })
      );

      // Update selected land if it's the one being adjusted
      if (selectedLand && selectedLand.id === landId) {
        setSelectedLand(prev => ({ ...prev, current_price: result.new_price }));
      }

      alert(`Price adjusted successfully! New price: NPR ${result.new_price.toLocaleString()}`);
    } catch (error) {
      console.error('Error adjusting price:', error);
      alert('Failed to adjust price. Please try again.');
    }
  };

  const handlePhotosUpdate = (photos) => {
    console.log('Photos updated:', photos);
    // Optionally refresh the current listing if viewing details
    if (selectedLand && selectedLand.id === createdListingId) {
      setSelectedLand(prev => ({ ...prev, photos }));
    }
  };

  const handleFinishPhotoUpload = () => {
    setShowPhotoUpload(false);
    setCreatedListingId(null);
    setViewMode('buyer');
    
    // Reset form
    setListingForm({
      title: '',
      description: '',
      province: '',
      district: '',
      municipality: '',
      ward: '',
      area: '',
      areaUnit: 'aana',
      pricePerUnit: '',
      roadAccess: false,
      roadWidth: '',
      waterSupply: false,
      electricity: false,
      residentialZone: false,
      commercialZone: false,
      agriculturalZone: false,
      kitta: '',
      plotNumber: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      documents: {
        landOwnershipCertificate: false,
        taxClearanceCertificate: false,
        characterCertificate: false,
        cadastralMap: false,
        noObjectionCertificate: false,
      }
    });
  };

  const calculateMLPrice = () => {
    // Mock ML price calculation based on features
    const basePrice = parseFloat(listingForm.area) * parseFloat(listingForm.pricePerUnit || 0);
    let multiplier = 1.0;

    if (listingForm.roadAccess) multiplier += 0.1;
    if (listingForm.waterSupply) multiplier += 0.05;
    if (listingForm.electricity) multiplier += 0.05;
    if (listingForm.commercialZone) multiplier += 0.2;
    if (listingForm.residentialZone) multiplier += 0.1;
    if (parseInt(listingForm.roadWidth) >= 15) multiplier += 0.1;

    return Math.round(basePrice * multiplier);
  };

  // Handle OCR document upload and extraction
  const handleDocumentExtraction = async (file) => {
    try {
      setOcrProcessing(true);
      setError(null);
      
      const result = await marketplaceService.extractDocumentData(file);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to extract document data');
      }
      
      setOcrExtractedData(result);
      
      // Auto-fill form fields with extracted data
      if (result.extracted_fields) {
        const extracted = result.extracted_fields;
        
        // Helper function to find best match in dropdown options (fuzzy matching)
        const findBestMatch = (extractedValue, options) => {
          if (!extractedValue || !options || options.length === 0) return null;
          
          const normalizedValue = extractedValue.toLowerCase().trim();
          
          // First try exact match
          const exactMatch = options.find(opt => opt.toLowerCase().trim() === normalizedValue);
          if (exactMatch) return exactMatch;
          
          // Try partial match
          const partialMatch = options.find(opt => 
            opt.toLowerCase().includes(normalizedValue) || normalizedValue.includes(opt.toLowerCase())
          );
          if (partialMatch) return partialMatch;
          
          // Try removing common words and matching
          const cleanedValue = normalizedValue
            .replace(/municipality|nagarpalika|gaunpalika|rural|metropolitan|sub-metropolitan/gi, '')
            .trim();
          
          const cleanedMatch = options.find(opt => {
            const cleanedOpt = opt.toLowerCase()
              .replace(/municipality|nagarpalika|gaunpalika|rural|metropolitan|sub-metropolitan/gi, '')
              .trim();
            return cleanedOpt === cleanedValue || cleanedOpt.includes(cleanedValue) || cleanedValue.includes(cleanedOpt);
          });
          
          return cleanedMatch || null;
        };
        
        // Find matching province
        let matchedProvince = null;
        if (extracted.district) {
          // Find which province contains this district
          for (const [prov, districts] of Object.entries(provinces)) {
            const districtMatch = findBestMatch(extracted.district, districts);
            if (districtMatch) {
              matchedProvince = prov;
              break;
            }
          }
        }
        
        // Prepare updates
        const updates = {
          // Owner name
          ...(extracted.owner_name && { ownerName: extracted.owner_name }),
          
          // Province (auto-detected from district)
          ...(matchedProvince && { province: matchedProvince }),
          
          // Ward number
          ...(extracted.ward_number && { ward: extracted.ward_number }),
          
          // Land details
          ...(extracted.plot_number && { 
            plotNumber: extracted.plot_number,
            kitta: extracted.plot_number 
          }),
          
          // Area - extract numeric value and try to detect unit
          ...(extracted.area && (() => {
            const areaText = extracted.area.toLowerCase();
            let areaValue = extracted.area.match(/\d+(\.\d+)?/)?.[0];
            let areaUnit = 'aana'; // default
            
            // Detect area unit
            if (areaText.includes('ropani') || areaText.includes('रोपनी')) {
              areaUnit = 'ropani';
            } else if (areaText.includes('aana') || areaText.includes('आना')) {
              areaUnit = 'aana';
            } else if (areaText.includes('sq') || areaText.includes('वर्ग')) {
              areaUnit = 'sqft';
            } else if (areaText.includes('bigha') || areaText.includes('बिघा')) {
              areaUnit = 'bigha';
            }
            
            return { area: areaValue || '', areaUnit };
          })()),
        };
        
        // Apply updates first
        setListingForm(prev => ({ ...prev, ...updates }));
        
        // Then handle district and municipality with slight delay to ensure province is set
        setTimeout(() => {
          if (matchedProvince && extracted.district) {
            const districtOptions = provinces[matchedProvince] || [];
            const matchedDistrict = findBestMatch(extracted.district, districtOptions);
            
            if (matchedDistrict) {
              setListingForm(prev => ({ ...prev, district: matchedDistrict }));
              
              // Now try to match municipality
              if (extracted.municipality) {
                const municipalityOptions = getMunicipalities(matchedDistrict);
                const matchedMunicipality = findBestMatch(extracted.municipality, municipalityOptions);
                
                if (matchedMunicipality) {
                  setTimeout(() => {
                    setListingForm(prev => ({ ...prev, municipality: matchedMunicipality }));
                  }, 100);
                }
              }
            }
          }
        }, 100);
      }
      
      setShowOcrPreview(true);
      
      // Show success message
      const extractedCount = result.extracted_fields ? Object.keys(result.extracted_fields).length : 0;
      alert(`✅ Document processed successfully!\n\n${result.message}\n\nExtracted ${extractedCount} field(s). Please review the auto-filled information and complete any missing details.`);
      
    } catch (err) {
      console.error('OCR extraction error:', err);
      setError(err.message || 'Failed to process document');
      throw err;
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleSubmitListing = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Prepare listing data for API
      const listingData = {
        title: listingForm.title,
        description: listingForm.description,
        province: listingForm.province,
        district: listingForm.district,
        municipality: listingForm.municipality,
        ward: parseInt(listingForm.ward),
        area: parseFloat(listingForm.area),
        area_unit: listingForm.areaUnit,
        price_per_unit: parseFloat(listingForm.pricePerUnit),
        kitta_number: listingForm.kitta,
        plot_number: listingForm.plotNumber,
        road_width: listingForm.roadWidth ? parseFloat(listingForm.roadWidth) : null,
        road_access: listingForm.roadAccess,
        water_supply: listingForm.waterSupply,
        electricity: listingForm.electricity,
        residential_zone: listingForm.residentialZone,
        commercial_zone: listingForm.commercialZone,
        agricultural_zone: listingForm.agriculturalZone,
        owner_name: listingForm.ownerName,
        owner_phone: listingForm.ownerPhone,
        owner_email: listingForm.ownerEmail,
        documents: {
          land_ownership_certificate: listingForm.documents.landOwnershipCertificate,
          tax_clearance_certificate: listingForm.documents.taxClearanceCertificate,
          character_certificate: listingForm.documents.characterCertificate,
          cadastral_map: listingForm.documents.cadastralMap,
          no_objection_certificate: listingForm.documents.noObjectionCertificate,
        }
      };

      const newListing = await marketplaceService.createListing(listingData);
      console.log('Listing created:', newListing);
      
      // Upload photos if any were added
      let uploadedCount = 0;
      let failedPhotos = [];
      
      if (pendingPhotos.length > 0) {
        setUploadingPhotos(true);
        
        for (let i = 0; i < pendingPhotos.length; i++) {
          const photo = pendingPhotos[i];
          try {
            console.log(`Uploading photo ${i + 1}/${pendingPhotos.length}:`, {
              listingId: newListing.id,
              fileName: photo.file.name,
              fileSize: photo.file.size,
              fileType: photo.file.type,
              caption: photo.caption,
              isPrimary: photo.isPrimary
            });
            
            const result = await marketplaceService.uploadPhoto(
              newListing.id,
              photo.file,
              photo.caption,
              photo.isPrimary
            );
            console.log(`Photo ${i + 1} uploaded successfully:`, result);
            uploadedCount++;
          } catch (err) {
            console.error(`Error uploading photo ${i + 1}:`, err);
            console.error('Error response:', err.response);
            console.error('Error data:', err.response?.data);
            console.error('Error status:', err.response?.status);
            const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
            failedPhotos.push({ index: i + 1, name: photo.file.name, error: errorMessage });
          }
        }
        
        setUploadingPhotos(false);
      }
      
      // Set submission result for modal
      setSubmissionResult({
        success: true,
        listing: newListing,
        totalPhotos: pendingPhotos.length,
        uploadedPhotos: uploadedCount,
        failedPhotos: failedPhotos
      });
      
      setShowSuccessModal(true);
      
      // Refresh listings
      await fetchListings();
      
      setShowListingForm(false);
      setPendingPhotos([]);
      
      // Reset form
      setListingForm({
        title: '',
        description: '',
        province: '',
        district: '',
        municipality: '',
        ward: '',
        area: '',
        areaUnit: 'aana',
        pricePerUnit: '',
        roadAccess: false,
        roadWidth: '',
        waterSupply: false,
        electricity: false,
        residentialZone: false,
        commercialZone: false,
        agriculturalZone: false,
        kitta: '',
        plotNumber: '',
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        documents: {
          landOwnershipCertificate: false,
          taxClearanceCertificate: false,
          characterCertificate: false,
          cadastralMap: false,
          noObjectionCertificate: false,
        }
      });
    } catch (error) {
      console.error('Error submitting listing:', error);
      alert('Failed to submit listing. Please check all fields and try again.');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatArea = (area, unit) => {
    return `${area} ${unit}`;
  };

  // Helper function to normalize API data (snake_case to camelCase)
  const normalizeListingData = (land) => {
    if (!land) return null;
    return {
      ...land,
      areaUnit: land.area_unit || land.areaUnit,
      pricePerUnit: land.price_per_unit || land.pricePerUnit,
      basePrice: land.base_price || land.basePrice,
      mlSuggestedPrice: land.ml_suggested_price || land.mlSuggestedPrice,
      currentPrice: land.current_price || land.currentPrice,
      kittaNumber: land.kitta_number || land.kittaNumber || land.kitta,
      plotNumber: land.plot_number || land.plotNumber,
      roadWidth: land.road_width || land.roadWidth,
      roadAccess: land.road_access !== undefined ? land.road_access : land.roadAccess,
      waterSupply: land.water_supply !== undefined ? land.water_supply : land.waterSupply,
      residentialZone: land.residential_zone !== undefined ? land.residential_zone : land.residentialZone,
      commercialZone: land.commercial_zone !== undefined ? land.commercial_zone : land.commercialZone,
      agriculturalZone: land.agricultural_zone !== undefined ? land.agricultural_zone : land.agriculturalZone,
      ownerName: land.owner_name || land.ownerName,
      ownerPhone: land.owner_phone || land.ownerPhone,
      ownerEmail: land.owner_email || land.ownerEmail,
      listedDate: land.listed_date || land.listedDate,
      documents: {
        landOwnershipCertificate: land.land_ownership_certificate !== undefined ? land.land_ownership_certificate : land.documents?.landOwnershipCertificate,
        taxClearanceCertificate: land.tax_clearance_certificate !== undefined ? land.tax_clearance_certificate : land.documents?.taxClearanceCertificate,
        characterCertificate: land.character_certificate !== undefined ? land.character_certificate : land.documents?.characterCertificate,
        cadastralMap: land.cadastral_map !== undefined ? land.cadastral_map : land.documents?.cadastralMap,
        noObjectionCertificate: land.no_objection_certificate !== undefined ? land.no_objection_certificate : land.documents?.noObjectionCertificate,
      }
    };
  };

  const requiredDocuments = [
    { key: 'landOwnershipCertificate', label: 'Land Ownership Certificate (Lalpurja)' },
    { key: 'taxClearanceCertificate', label: 'Tax Clearance Certificate' },
    { key: 'characterCertificate', label: 'Character Certificate' },
    { key: 'cadastralMap', label: 'Cadastral Map (Napi Naksa)' },
    { key: 'noObjectionCertificate', label: 'No Objection Certificate' },
  ];

  const legalProcedures = [
    "1. Verify Land Ownership - Check Lalpurja and cadastral records at Land Revenue Office",
    "2. Document Verification - Verify all documents are authentic and up-to-date",
    "3. Site Inspection - Physical verification of the land and boundaries",
    "4. Price Negotiation - Negotiate final price with seller",
    "5. Sale Agreement - Prepare and sign the sale agreement (Baiknama)",
    "6. Payment - Make payment as per agreement terms",
    "7. Registration - Register the land at Land Revenue Office",
    "8. Transfer Certificate - Obtain land ownership transfer certificate",
    "9. Update Records - Update land records in your name",
    "10. Tax Payment - Pay all applicable taxes and fees"
  ];

  return (
    <div className="land-marketplace">
      <div className="marketplace-header">
        <h1>Ropani Land Marketplace</h1>
        <p>Buy and sell land with AI-powered price predictions</p>
        
        <div className="view-mode-toggle">
          <button 
            className={viewMode === 'buyer' ? 'active' : ''}
            onClick={() => {
              setViewMode('buyer');
              setShowListingForm(false);
            }}
          >
            <FaSearch /> Browse Lands
          </button>
          <button 
            className={viewMode === 'seller' ? 'active' : ''}
            onClick={() => {
              setViewMode('seller');
              setShowListingForm(true);
            }}
          >
            <FaHome /> List Your Land
          </button>
        </div>
      </div>

      {viewMode === 'buyer' && !selectedLand && (
        <div className="buyer-view">
          <div className="marketplace-content">
            {showFilters && (
              <div className="filters-panel">
                <div className="filters-header">
                  <h3><FaFilter /> Filters</h3>
                  <button onClick={() => setShowFilters(false)}>Hide</button>
                </div>

                <div className="filter-group">
                  <label>Province</label>
                  <select name="province" value={filters.province} onChange={handleFilterChange}>
                    <option value="">All Provinces</option>
                    {Object.keys(provinces).map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>District</label>
                  <select 
                    name="district" 
                    value={filters.district} 
                    onChange={handleFilterChange}
                    disabled={!filters.province}
                  >
                    <option value="">All Districts</option>
                    {availableDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Municipality</label>
                  <select 
                    name="municipality" 
                    value={filters.municipality} 
                    onChange={handleFilterChange}
                    disabled={!filters.district}
                  >
                    <option value="">All Municipalities</option>
                    {availableMunicipalities.map(mun => (
                      <option key={mun} value={mun}>{mun}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Price Range (NPR)</label>
                  <div className="range-inputs">
                    <input 
                      type="number" 
                      name="minPrice" 
                      placeholder="Min" 
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                    />
                    <span>to</span>
                    <input 
                      type="number" 
                      name="maxPrice" 
                      placeholder="Max" 
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>Area Range</label>
                  <div className="range-inputs">
                    <input 
                      type="number" 
                      name="minArea" 
                      placeholder="Min" 
                      value={filters.minArea}
                      onChange={handleFilterChange}
                    />
                    <span>to</span>
                    <input 
                      type="number" 
                      name="maxArea" 
                      placeholder="Max" 
                      value={filters.maxArea}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>Amenities</label>
                  <div className="checkbox-group">
                    <label>
                      <input 
                        type="checkbox" 
                        name="roadAccess" 
                        checked={filters.roadAccess}
                        onChange={handleFilterChange}
                      />
                      <FaRoad /> Road Access
                    </label>
                    <label>
                      <input 
                        type="checkbox" 
                        name="waterSupply" 
                        checked={filters.waterSupply}
                        onChange={handleFilterChange}
                      />
                      <FaWater /> Water Supply
                    </label>
                    <label>
                      <input 
                        type="checkbox" 
                        name="electricity" 
                        checked={filters.electricity}
                        onChange={handleFilterChange}
                      />
                      <FaBolt /> Electricity
                    </label>
                  </div>
                </div>

                <div className="filter-group">
                  <label>Land Type</label>
                  <div className="checkbox-group">
                    <label>
                      <input 
                        type="checkbox" 
                        name="residentialZone" 
                        checked={filters.residentialZone}
                        onChange={handleFilterChange}
                      />
                      Residential
                    </label>
                    <label>
                      <input 
                        type="checkbox" 
                        name="commercialZone" 
                        checked={filters.commercialZone}
                        onChange={handleFilterChange}
                      />
                      Commercial
                    </label>
                    <label>
                      <input 
                        type="checkbox" 
                        name="agriculturalZone" 
                        checked={filters.agriculturalZone}
                        onChange={handleFilterChange}
                      />
                      Agricultural
                    </label>
                  </div>
                </div>

                <button 
                  className="clear-filters"
                  onClick={() => setFilters({
                    province: '',
                    district: '',
                    municipality: '',
                    minPrice: '',
                    maxPrice: '',
                    minArea: '',
                    maxArea: '',
                    roadAccess: false,
                    waterSupply: false,
                    electricity: false,
                    residentialZone: false,
                    commercialZone: false,
                    agriculturalZone: false,
                  })}
                >
                  Clear All Filters
                </button>
              </div>
            )}

            <div className="lands-list">
              {!showFilters && (
                <button className="show-filters-btn" onClick={() => setShowFilters(true)}>
                  <FaFilter /> Show Filters
                </button>
              )}

              <div className="results-header">
                <h3>{filteredLands.length} Properties Found</h3>
              </div>

              <div className="lands-grid">
                {filteredLands.map(land => (
                  <div key={land.id} className="land-card" onClick={() => setSelectedLand(land)}>
                    {/* Photo Section */}
                    {land.photos && land.photos.length > 0 ? (
                      <div className="land-card-image">
                        <img 
                          src={`data:${land.photos[0].photo_type};base64,${land.photos[0].photo_data}`}
                          alt={land.title}
                        />
                        {land.photos.length > 1 && (
                          <div className="photo-count-badge">
                            <FaImage /> {land.photos.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="land-card-no-image">
                        <FaImage />
                        <span>No Photo</span>
                      </div>
                    )}

                    <div className="land-card-content">
                      <div className="land-card-header">
                        <h3>{land.title}</h3>
                        <span className={`zone-badge ${land.commercialZone ? 'commercial' : land.residentialZone ? 'residential' : 'agricultural'}`}>
                          {land.commercialZone ? 'Commercial' : land.residentialZone ? 'Residential' : 'Agricultural'}
                        </span>
                      </div>

                      <div className="land-location">
                        <FaMapMarkerAlt />
                        <span>{land.municipality}, {land.district}</span>
                      </div>

                      <div className="land-details">
                        <div className="detail-item">
                          <FaRulerCombined />
                          <span>{formatArea(land.area, land.areaUnit)}</span>
                        </div>
                        <div className="detail-item">
                          <FaMoneyBillWave />
                          <span>{formatPrice(land.currentPrice)}</span>
                        </div>
                      </div>

                      <div className="land-features">
                        {land.roadAccess && <span className="feature"><FaRoad /> Road</span>}
                        {land.waterSupply && <span className="feature"><FaWater /> Water</span>}
                        {land.electricity && <span className="feature"><FaBolt /> Power</span>}
                      </div>

                      <div className="ml-price-badge">
                        <span>ML Suggested: {formatPrice(land.mlSuggestedPrice)}</span>
                      </div>

                      <button className="view-details-btn">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'buyer' && selectedLand && (
        <div className="land-details-view">
          <button className="back-btn" onClick={() => setSelectedLand(null)}>
            ← Back to Listings
          </button>

          <div className="land-details-content">
            <div className="details-main">
              <h1>{selectedLand.title}</h1>
              
              {/* Photo Gallery */}
              {selectedLand.photos && selectedLand.photos.length > 0 && (
                <div className="details-photo-gallery">
                  <div className="primary-photo">
                    <img 
                      src={`data:${selectedLand.photos[0].photo_type};base64,${selectedLand.photos[0].photo_data}`}
                      alt={selectedLand.photos[0].caption || selectedLand.title}
                    />
                    {selectedLand.photos[0].caption && (
                      <p className="photo-caption">{selectedLand.photos[0].caption}</p>
                    )}
                  </div>
                  
                  {selectedLand.photos.length > 1 && (
                    <div className="photo-thumbnails">
                      {selectedLand.photos.slice(1).map((photo, idx) => (
                        <div key={photo.id} className="thumbnail">
                          <img 
                            src={`data:${photo.photo_type};base64,${photo.photo_data}`}
                            alt={photo.caption || `Photo ${idx + 2}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="price-section">
                <div className="price-info">
                  <div className="current-price">
                    <span className="label">Current Price</span>
                    <span className="amount">{formatPrice(selectedLand.currentPrice)}</span>
                  </div>
                  <div className="ml-price">
                    <span className="label">ML Suggested Price</span>
                    <span className="amount">{formatPrice(selectedLand.mlSuggestedPrice)}</span>
                  </div>
                  <div className="price-per-unit">
                    <span className="label">Price per {selectedLand.areaUnit}</span>
                    <span className="amount">{formatPrice(selectedLand.pricePerUnit)}</span>
                  </div>
                </div>

                <div className="price-adjustment">
                  <h3>Negotiate Price</h3>
                  <div className="adjustment-controls">
                    <button onClick={() => handlePriceAdjustment(selectedLand.id, -100000)}>
                      <FaArrowDown /> -1 Lakh
                    </button>
                    <button onClick={() => handlePriceAdjustment(selectedLand.id, -500000)}>
                      <FaArrowDown /> -5 Lakh
                    </button>
                    <button onClick={() => handlePriceAdjustment(selectedLand.id, 100000)}>
                      <FaArrowUp /> +1 Lakh
                    </button>
                    <button onClick={() => handlePriceAdjustment(selectedLand.id, 500000)}>
                      <FaArrowUp /> +5 Lakh
                    </button>
                  </div>
                </div>
              </div>

              <div className="location-info">
                <h3><FaMapMarkerAlt /> Location</h3>
                <p><strong>Province:</strong> {selectedLand.province}</p>
                <p><strong>District:</strong> {selectedLand.district}</p>
                <p><strong>Municipality:</strong> {selectedLand.municipality}</p>
                <p><strong>Ward:</strong> {selectedLand.ward}</p>
              </div>

              <div className="land-specifications">
                <h3><FaRulerCombined /> Specifications</h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Total Area:</span>
                    <span className="spec-value">{formatArea(selectedLand.area, selectedLand.areaUnit)}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Kitta Number:</span>
                    <span className="spec-value">{selectedLand.kitta}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Plot Number:</span>
                    <span className="spec-value">{selectedLand.plotNumber}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Road Width:</span>
                    <span className="spec-value">{selectedLand.roadWidth} ft</span>
                  </div>
                </div>
              </div>

              <div className="amenities-section">
                <h3>Amenities & Features</h3>
                <div className="amenities-grid">
                  <div className={`amenity ${selectedLand.roadAccess ? 'available' : 'unavailable'}`}>
                    <FaRoad />
                    <span>Road Access</span>
                    {selectedLand.roadAccess ? <FaCheckCircle /> : <FaTimesCircle />}
                  </div>
                  <div className={`amenity ${selectedLand.waterSupply ? 'available' : 'unavailable'}`}>
                    <FaWater />
                    <span>Water Supply</span>
                    {selectedLand.waterSupply ? <FaCheckCircle /> : <FaTimesCircle />}
                  </div>
                  <div className={`amenity ${selectedLand.electricity ? 'available' : 'unavailable'}`}>
                    <FaBolt />
                    <span>Electricity</span>
                    {selectedLand.electricity ? <FaCheckCircle /> : <FaTimesCircle />}
                  </div>
                </div>
              </div>

              <div className="description-section">
                <h3>Description</h3>
                <p>{selectedLand.description}</p>
              </div>

              <div className="documents-section">
                <h3><FaFileAlt /> Required Documents</h3>
                <div className="documents-list">
                  {requiredDocuments.map(doc => (
                    <div key={doc.key} className={`document-item ${selectedLand.documents[doc.key] ? 'available' : 'unavailable'}`}>
                      {selectedLand.documents[doc.key] ? <FaCheckCircle /> : <FaTimesCircle />}
                      <span>{doc.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="legal-procedures-section">
                <h3>Legal Procedures for Land Purchase</h3>
                <div className="procedures-list">
                  {legalProcedures.map((procedure, idx) => (
                    <div key={idx} className="procedure-item">
                      <span className="procedure-number">{idx + 1}</span>
                      <p>{procedure.split(' - ')[1] || procedure}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="contact-section">
                <h3>Contact Owner</h3>
                <div className="contact-info">
                  <div className="contact-item">
                    <strong>Name:</strong> {selectedLand.ownerName}
                  </div>
                  <div className="contact-item">
                    <FaPhone /> {selectedLand.ownerPhone}
                  </div>
                  <div className="contact-item">
                    <FaEnvelope /> {selectedLand.ownerEmail}
                  </div>
                </div>
                <button className="contact-btn">Contact Owner</button>
                <button className="buy-btn">Proceed to Buy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'seller' && showListingForm && (
        <div className="listing-form-container">
          <h2>List Your Land for Sale</h2>
          <p className="form-subtitle">Fill in the details below and get an AI-powered price suggestion</p>

          <form onSubmit={handleSubmitListing} className="listing-form">
            {/* Document Upload Section with OCR */}
            <DocumentUpload 
              onDocumentExtracted={handleDocumentExtraction}
              disabled={ocrProcessing || loading}
            />

            {/* Show OCR Preview if available */}
            {showOcrPreview && ocrExtractedData && (
              <div className="ocr-preview-box">
                <div className="ocr-preview-header">
                  <FaCheckCircle className="ocr-success-icon" />
                  <h4>Document Processed Successfully!</h4>
                </div>
                <p className="ocr-preview-message">
                  We've extracted the following information from your document. 
                  Please review and complete any missing fields below.
                </p>
                <div className="extracted-fields-summary">
                  <h5>Extracted Fields:</h5>
                  <div className="extracted-fields-grid">
                    {Object.entries(ocrExtractedData.extracted_fields).map(([key, value]) => (
                      <div key={key} className="extracted-field-item">
                        <span className="field-label">{key.replace(/_/g, ' ')}: </span>
                        <span className="field-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="close-preview-btn"
                  onClick={() => setShowOcrPreview(false)}
                >
                  Close Preview
                </button>
              </div>
            )}

            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label>Property Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  value={listingForm.title}
                  onChange={handleListingFormChange}
                  placeholder="e.g., Residential Land in Kathmandu"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  name="description" 
                  value={listingForm.description}
                  onChange={handleListingFormChange}
                  placeholder="Describe your property in detail..."
                  rows="4"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Location Details</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Province *</label>
                  <select 
                    name="province" 
                    value={listingForm.province}
                    onChange={handleListingFormChange}
                    required
                  >
                    <option value="">Select Province</option>
                    {Object.keys(provinces).map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>District *</label>
                  <select 
                    name="district" 
                    value={listingForm.district}
                    onChange={handleListingFormChange}
                    disabled={!listingForm.province}
                    required
                  >
                    <option value="">Select District</option>
                    {availableDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Municipality *</label>
                  <select 
                    name="municipality" 
                    value={listingForm.municipality}
                    onChange={handleListingFormChange}
                    disabled={!listingForm.district}
                    required
                  >
                    <option value="">Select Municipality</option>
                    {availableMunicipalities.map(mun => (
                      <option key={mun} value={mun}>{mun}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ward Number *</label>
                  <input 
                    type="number" 
                    name="ward" 
                    value={listingForm.ward}
                    onChange={handleListingFormChange}
                    placeholder="Ward number"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Land Specifications</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Area *</label>
                  <input 
                    type="number" 
                    name="area" 
                    value={listingForm.area}
                    onChange={handleListingFormChange}
                    placeholder="Area"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Unit *</label>
                  <select 
                    name="areaUnit" 
                    value={listingForm.areaUnit}
                    onChange={handleListingFormChange}
                    required
                  >
                    <option value="aana">Aana</option>
                    <option value="ropani">Ropani</option>
                    <option value="bigha">Bigha</option>
                    <option value="sqft">Sq. Ft.</option>
                    <option value="sqm">Sq. M.</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Price per Unit (NPR) *</label>
                  <input 
                    type="number" 
                    name="pricePerUnit" 
                    value={listingForm.pricePerUnit}
                    onChange={handleListingFormChange}
                    placeholder="Expected price per unit"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kitta Number *</label>
                  <input 
                    type="text" 
                    name="kitta" 
                    value={listingForm.kitta}
                    onChange={handleListingFormChange}
                    placeholder="Kitta number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Plot Number *</label>
                  <input 
                    type="text" 
                    name="plotNumber" 
                    value={listingForm.plotNumber}
                    onChange={handleListingFormChange}
                    placeholder="Plot number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Road Width (ft)</label>
                  <input 
                    type="number" 
                    name="roadWidth" 
                    value={listingForm.roadWidth}
                    onChange={handleListingFormChange}
                    placeholder="Road width in feet"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Features & Amenities</h3>
              
              <div className="checkbox-grid">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="roadAccess" 
                    checked={listingForm.roadAccess}
                    onChange={handleListingFormChange}
                  />
                  <FaRoad /> Road Access
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="waterSupply" 
                    checked={listingForm.waterSupply}
                    onChange={handleListingFormChange}
                  />
                  <FaWater /> Water Supply
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="electricity" 
                    checked={listingForm.electricity}
                    onChange={handleListingFormChange}
                  />
                  <FaBolt /> Electricity
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Land Type</h3>
              
              <div className="checkbox-grid">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="residentialZone" 
                    checked={listingForm.residentialZone}
                    onChange={handleListingFormChange}
                  />
                  Residential Zone
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="commercialZone" 
                    checked={listingForm.commercialZone}
                    onChange={handleListingFormChange}
                  />
                  Commercial Zone
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="agriculturalZone" 
                    checked={listingForm.agriculturalZone}
                    onChange={handleListingFormChange}
                  />
                  Agricultural Zone
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Owner Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Owner Name *</label>
                  <input 
                    type="text" 
                    name="ownerName" 
                    value={listingForm.ownerName}
                    onChange={handleListingFormChange}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input 
                    type="tel" 
                    name="ownerPhone" 
                    value={listingForm.ownerPhone}
                    onChange={handleListingFormChange}
                    placeholder="98XXXXXXXX"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    name="ownerEmail" 
                    value={listingForm.ownerEmail}
                    onChange={handleListingFormChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Required Documents</h3>
              <p className="section-subtitle">Please check the documents you have ready</p>
              
              <div className="documents-checklist">
                {requiredDocuments.map(doc => (
                  <label key={doc.key} className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={listingForm.documents[doc.key]}
                      onChange={() => handleDocumentChange(doc.key)}
                    />
                    {doc.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3><FaImage /> Land Photos</h3>
              <p className="section-subtitle">
                Add photos of your land to attract more buyers (optional but recommended)
              </p>
              
              <div className="inline-photo-upload">
                <input
                  type="file"
                  id="photo-input"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
                <label htmlFor="photo-input" className="photo-upload-btn">
                  <FaCamera /> Choose Photos
                </label>
                <span className="photo-hint">Max 5MB each • JPEG, PNG, WebP</span>
              </div>

              {pendingPhotos.length > 0 && (
                <div className="pending-photos-grid">
                  {pendingPhotos.map((photo, index) => (
                    <div key={index} className="pending-photo-item">
                      <div className="photo-preview-wrapper">
                        <img src={photo.preview} alt={`Preview ${index + 1}`} />
                        {photo.isPrimary && (
                          <span className="primary-badge-inline">⭐ Primary</span>
                        )}
                        <button
                          type="button"
                          className="remove-photo-btn"
                          onClick={() => handleRemovePendingPhoto(index)}
                        >
                          ×
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Caption (optional)"
                        value={photo.caption}
                        onChange={(e) => handlePhotoCaptionChange(index, e.target.value)}
                        className="photo-caption-input"
                      />
                      {!photo.isPrimary && (
                        <button
                          type="button"
                          className="set-primary-btn"
                          onClick={() => handleSetPrimaryPending(index)}
                        >
                          Set as Primary
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {pendingPhotos.length === 0 && (
                <div className="no-photos-placeholder">
                  <FaCamera />
                  <p>No photos selected yet</p>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => {
                setShowListingForm(false);
                setViewMode('buyer');
                setPendingPhotos([]);
              }}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading || uploadingPhotos}>
                {loading ? 'Submitting...' : uploadingPhotos ? 'Uploading Photos...' : `Submit Listing${pendingPhotos.length > 0 ? ` with ${pendingPhotos.length} Photo(s)` : ''}`}
              </button>
            </div>
          </form>

          {/* Photo Upload Section - Shows after listing is created */}
          {showPhotoUpload && createdListingId && (
            <div className="photo-upload-section">
              <div className="section-divider">
                <h2>📸 Upload Photos</h2>
                <p>Make your listing stand out by adding photos of your land</p>
              </div>
              
              <PhotoUpload 
                listingId={createdListingId}
                onPhotosUpdate={handlePhotosUpdate}
                existingPhotos={[]}
              />

              <div className="form-actions">
                <button 
                  type="button" 
                  className="finish-btn"
                  onClick={handleFinishPhotoUpload}
                >
                  Finish & View Listings
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && submissionResult && (
        <div className="modal-overlay" onClick={() => {
          setShowSuccessModal(false);
          setViewMode('buyer');
        }}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <FaCheckCircle className="success-icon" />
              <h2>Listing Submitted Successfully!</h2>
            </div>
            
            <div className="modal-body">
              <div className="modal-section">
                <h3>📋 Listing Details</h3>
                <p><strong>Title:</strong> {submissionResult.listing.title}</p>
                <p><strong>ML Suggested Price:</strong> NPR {submissionResult.listing.ml_suggested_price?.toLocaleString()}</p>
                <p><strong>Current Price:</strong> NPR {submissionResult.listing.current_price?.toLocaleString()}</p>
              </div>

              {submissionResult.totalPhotos > 0 && (
                <div className="modal-section">
                  <h3>📸 Photo Upload Results</h3>
                  {submissionResult.uploadedPhotos === submissionResult.totalPhotos ? (
                    <div className="success-message">
                      <FaCheckCircle style={{ color: '#27ae60' }} />
                      <p>All {submissionResult.totalPhotos} photo(s) uploaded successfully!</p>
                    </div>
                  ) : (
                    <div>
                      <p className={submissionResult.uploadedPhotos > 0 ? 'warning-message' : 'error-message'}>
                        Uploaded {submissionResult.uploadedPhotos} of {submissionResult.totalPhotos} photo(s)
                      </p>
                      {submissionResult.failedPhotos.length > 0 && (
                        <div className="failed-photos-list">
                          <p><strong>Failed uploads:</strong></p>
                          <ul>
                            {submissionResult.failedPhotos.map((failed, idx) => (
                              <li key={idx}>
                                Photo {failed.index}: {failed.name} - {failed.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {submissionResult.totalPhotos === 0 && (
                <div className="modal-section">
                  <p className="info-message">
                    ℹ️ No photos were uploaded with this listing. You can add photos later by editing the listing.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="modal-btn primary"
                onClick={() => {
                  setShowSuccessModal(false);
                  setViewMode('buyer');
                }}
              >
                View All Listings
              </button>
              <button 
                className="modal-btn secondary"
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowListingForm(true);
                }}
              >
                Create Another Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandMarketplace;
