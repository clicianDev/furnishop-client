import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import { getS3Url } from '../config/s3Config';
import Toast from '../components/Toast';
import './CustomFurniturePage.css';

const FURNITURE_TYPES = [
  { name: 'Door', price: 8000 },
  { name: 'Table', price: 12000 },
  { name: 'Cabinet', price: 15000 },
  { name: 'Chair', price: 5000 },
  { name: 'Bed', price: 25000 },
];

const WOOD_TYPES = [
  { name: 'Mahogany', displayName: 'Mahogany', multiplier: 1.5 },
  { name: 'Gmelina', displayName: 'Gmelina', multiplier: 1.0 },
];

const VARNISH_TYPES = [
  { 
    name: 'Plywood', 
    displayName: 'Plywood',
    price: 0,
    image: getS3Url('textures/plywood/basecolor.jpg'),
    folder: 'plywood'
  },
  { 
    name: 'Dark Wood', 
    displayName: 'Dark Wood',
    price: 2000,
    image: getS3Url('textures/dark_wood/basecolor.jpg'),
    folder: 'dark_wood'
  },
  { 
    name: 'Oak Veneer', 
    displayName: 'Oak Veneer',
    price: 2500,
    image: getS3Url('textures/oak_veener/basecolor.jpg'),
    folder: 'oak_veener'
  },
  { 
    name: 'Plywood Varnished', 
    displayName: 'Plywood Varnished',
    price: 2000,
    image: getS3Url('textures/plywood_varnished/basecolor.jpg'),
    folder: 'plywood_varnished'
  },
];

const CustomFurniturePage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    furnitureType: '',
    width: '',
    height: '',
    woodType: '',
    varnishType: '',
    notes: '',
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    calculatePrice();
  }, [formData]);

  const calculatePrice = () => {
    const { furnitureType, woodType, varnishType } = formData;
    
    if (!furnitureType || !woodType || !varnishType) {
      setTotalPrice(0);
      return;
    }

    const furniture = FURNITURE_TYPES.find(f => f.name === furnitureType);
    const wood = WOOD_TYPES.find(w => w.name === woodType);
    const varnish = VARNISH_TYPES.find(v => v.name === varnishType);

    if (!furniture || !wood || !varnish) {
      setTotalPrice(0);
      return;
    }

    // Calculate based on furniture type, wood multiplier, and varnish price
    const basePrice = furniture.price * wood.multiplier;
    const total = basePrice + varnish.price;

    setTotalPrice(Math.round(total));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (selectedImages.length + files.length > 5) {
      showToast('Maximum 5 images allowed', 'error');
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      showToast('Please login to submit a custom order', 'error');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const { furnitureType, width, height, woodType, varnishType } = formData;

    if (!furnitureType || !width || !height || !woodType || !varnishType) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (parseFloat(width) <= 0 || parseFloat(height) <= 0) {
      showToast('Please enter valid dimensions', 'error');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('furnitureType', furnitureType);
      submitData.append('width', width);
      submitData.append('height', height);
      submitData.append('woodType', woodType);
      submitData.append('varnishType', varnishType);
      submitData.append('totalPrice', totalPrice);
      submitData.append('notes', formData.notes);

      // Append images
      selectedImages.forEach((image, index) => {
        submitData.append('images', image);
      });

      const response = await api.post('/api/custom-orders', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showToast('Custom order submitted successfully!', 'success');
      
      // Reset form
      setTimeout(() => {
        setFormData({
          furnitureType: '',
          width: '',
          height: '',
          woodType: '',
          varnishType: '',
          notes: '',
        });
        setSelectedImages([]);
        setImagePreviews([]);
        setTotalPrice(0);
        navigate('/user-dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting custom order:', error);
      showToast(error.response?.data?.message || 'Failed to submit order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDesign = () => {
    const design = {
      ...formData,
      totalPrice,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('savedCustomDesign', JSON.stringify(design));
    showToast('Design saved locally!', 'success');
  };

  return (
    <div className="custom-furniture-page">
      <div className="custom-furniture-container">
        <div className="custom-furniture-header">
          <h1>Custom Furniture Designer</h1>
          <p>Create your dream furniture with custom specifications</p>
        </div>

        <div className="custom-furniture-content">
          {/* Form Section */}
          <form onSubmit={handleSubmit} className="custom-form">
            {/* 1. Furniture Type */}
            <div className="form-section">
              <h2>1. Select Furniture Type</h2>
              <div className="furniture-type-grid">
                {FURNITURE_TYPES.map((furniture) => (
                  <button
                    key={furniture.name}
                    type="button"
                    className={`furniture-type-card ${formData.furnitureType === furniture.name ? 'selected' : ''}`}
                    onClick={() => handleInputChange({ target: { name: 'furnitureType', value: furniture.name } })}
                  >
                    <span className="furniture-name">{furniture.name}</span>
                    <span className="furniture-price">₱{furniture.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Dimensions */}
            <div className="form-section">
              <h2>2. Enter Desired Dimensions</h2>
              <div className="dimensions-grid">
                <div className="input-group">
                  <label htmlFor="width">Width (cm)</label>
                  <input
                    type="number"
                    id="width"
                    name="width"
                    value={formData.width}
                    onChange={handleInputChange}
                    placeholder="e.g., 120"
                    min="1"
                    step="0.1"
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="height">Height (cm)</label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    placeholder="e.g., 180"
                    min="1"
                    step="0.1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 3. Wood Type */}
            <div className="form-section">
              <h2>3. Choose Wood Type</h2>
              <div className="wood-type-grid">
                {WOOD_TYPES.map((wood) => (
                  <button
                    key={wood.name}
                    type="button"
                    className={`wood-type-card ${formData.woodType === wood.name ? 'selected' : ''}`}
                    onClick={() => handleInputChange({ target: { name: 'woodType', value: wood.name } })}
                  >
                    <span className="wood-name">{wood.name}</span>
                    <span className="wood-multiplier">{wood.multiplier}x</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Varnish Type */}
            <div className="form-section">
              <h2>4. Select Varnish Finish</h2>
              <div className="varnish-type-grid">
                {VARNISH_TYPES.map((varnish) => (
                  <button
                    key={varnish.name}
                    type="button"
                    className={`varnish-type-card ${formData.varnishType === varnish.name ? 'selected' : ''}`}
                    onClick={() => handleInputChange({ target: { name: 'varnishType', value: varnish.name } })}
                  >
                    <div className="varnish-image-container">
                      <img 
                        src={varnish.image} 
                        alt={varnish.displayName}
                        className="varnish-preview-image"
                      />
                    </div>
                    <span className="varnish-name">{varnish.displayName}</span>
                    <span className="varnish-price">
                      {varnish.price === 0 ? 'Free' : `+₱${varnish.price.toLocaleString()}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Upload Images */}
            <div className="form-section">
              <h2>5. Send Example Pictures (Optional)</h2>
              <p className="section-subtitle">Upload up to 5 reference images</p>
              
              <div className="image-upload-container">
                {imagePreviews.length < 5 && (
                  <label className="image-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-placeholder">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span>Click to upload</span>
                      <span className="upload-hint">{5 - imagePreviews.length} remaining</span>
                    </div>
                  </label>
                )}

                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="form-section">
              <h2>Additional Notes</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any special requests or details..."
                rows="4"
                className="notes-textarea"
              />
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-save-design"
                onClick={handleSaveDesign}
              >
                Save Design
              </button>
              <button
                type="submit"
                className="btn-submit-order"
                disabled={loading || !totalPrice}
              >
                {loading ? 'Submitting...' : 'Submit Order'}
              </button>
            </div>
          </form>

          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-content">
              {formData.furnitureType && (
                <div className="summary-item">
                  <span className="summary-label">Furniture Type:</span>
                  <span className="summary-value">{formData.furnitureType}</span>
                </div>
              )}

              {formData.width && formData.height && (
                <div className="summary-item">
                  <span className="summary-label">Dimensions:</span>
                  <span className="summary-value">{formData.width} × {formData.height} cm</span>
                </div>
              )}

              {formData.woodType && (
                <div className="summary-item">
                  <span className="summary-label">Wood Type:</span>
                  <span className="summary-value">{formData.woodType}</span>
                </div>
              )}

              {formData.varnishType && (
                <div className="summary-item">
                  <span className="summary-label">Varnish Finish:</span>
                  <span className="summary-value">{formData.varnishType}</span>
                </div>
              )}

              {selectedImages.length > 0 && (
                <div className="summary-item">
                  <span className="summary-label">Reference Images:</span>
                  <span className="summary-value">{selectedImages.length} image(s)</span>
                </div>
              )}

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span className="total-label">Estimated Price:</span>
                <span className="total-price">
                  {totalPrice > 0 ? `₱${totalPrice.toLocaleString()}` : '₱0'}
                </span>
              </div>

              {totalPrice > 0 && (
                <p className="price-note">
                  * Final price may vary based on actual materials and complexity
                </p>
              )}
            </div>

            {!isLoggedIn && (
              <div className="login-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>Please login to submit your custom order</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </div>
  );
};

export default CustomFurniturePage;
