import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod'); // Default to Cash on Delivery
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    zipCode: '',
    country: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    referenceNumber: '',
    senderNumber: '',
    senderName: ''
  });
  const [transactionScreenshot, setTransactionScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/api/payment-methods');
      setPaymentMethods(response.data);
      // Keep COD as default, don't auto-select eWallet methods
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedCart = cart.map(item =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleInputChange = (e) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    
    // Format sender number to +63 format
    if (name === 'senderNumber') {
      if (!value.startsWith('+63')) {
        setPaymentInfo({ ...paymentInfo, [name]: '+63' });
        return;
      }
      const digits = value.slice(3);
      if (digits.length <= 10 && /^\d*$/.test(digits)) {
        setPaymentInfo({ ...paymentInfo, [name]: value });
      }
    } else {
      setPaymentInfo({ ...paymentInfo, [name]: value });
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, JPEG, and PNG files are allowed!');
        e.target.value = '';
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }

      setTransactionScreenshot(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setTransactionScreenshot(null);
    setScreenshotPreview('');
    // Reset file input
    const fileInput = document.querySelector('input[name="transactionScreenshot"]');
    if (fileInput) fileInput.value = '';
  };

  const uploadScreenshotToS3 = async () => {
    if (!transactionScreenshot) {
      return null;
    }

    setUploadingScreenshot(true);
    try {
      const formData = new FormData();
      formData.append('images', transactionScreenshot);

      const response = await api.post('/api/transactions/upload-screenshot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.imageUrls[0];
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      alert('Failed to upload screenshot: ' + (error.response?.data?.message || error.message));
      return null;
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to complete your purchase');
      navigate('/login');
      return;
    }

    if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.zipCode || !shippingInfo.country) {
      alert('Please fill in all shipping information');
      return;
    }

    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    // Only require payment info for eWallet methods (not COD)
    if (selectedPaymentMethod !== 'cod') {
      // If no screenshot, require all payment fields
      if (!transactionScreenshot) {
        if (!paymentInfo.referenceNumber || !paymentInfo.senderNumber || !paymentInfo.senderName) {
          alert('Please fill in all payment information or upload a transaction screenshot');
          return;
        }

        if (!/^\+63\d{10}$/.test(paymentInfo.senderNumber)) {
          alert('Please enter a valid sender number (+63 followed by 10 digits)');
          return;
        }
      }
    }

    try {
      let screenshotUrl = null;

      // Upload screenshot if provided (only for eWallet payments)
      if (transactionScreenshot && selectedPaymentMethod !== 'cod') {
        screenshotUrl = await uploadScreenshotToS3();
        if (!screenshotUrl) {
          return;
        }
      }

      const transactionData = {
        products: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: calculateTotal(),
        shippingAddress: shippingInfo,
        paymentMethod: selectedPaymentMethod === 'cod' 
          ? { provider: 'Cash on Delivery' }
          : {
              provider: selectedPaymentMethod.serviceProvider,
              referenceNumber: paymentInfo.referenceNumber,
              senderNumber: paymentInfo.senderNumber,
              senderName: paymentInfo.senderName,
              screenshot: screenshotUrl
            }
      };

      await api.post('/api/transactions', transactionData);

      alert('Order placed successfully!');
      localStorage.removeItem('cart');
      setCart([]);
      navigate('/user-dashboard');
    } catch (error) {
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="checkout-page container">
      <h1>Shopping Cart & Checkout</h1>

      <div className="checkout-container">
        <div className="cart-section">
          <h2>Your Cart</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.productId} className="cart-item card">
                  <img src={item.image || 'https://via.placeholder.com/100'} alt={item.name} />
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="item-price">₱{item.price.toFixed(2)}</p>
                  </div>
                  <div className="item-quantity">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                  </div>
                  <p className="item-total">₱{(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeItem(item.productId)} className="btn-remove">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="checkout-section">
            <div className="card">
              <h2>Shipping Information</h2>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={shippingInfo.address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={shippingInfo.city}
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={shippingInfo.zipCode}
                  onChange={handleInputChange}
                  placeholder="ZIP Code"
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={shippingInfo.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                />
              </div>

              {/* Payment Method Section */}
              <div className="payment-method-section">
                <h2>Payment Method</h2>
                <div className="payment-methods-grid">
                  {/* Cash on Delivery Option */}
                  <div
                    className={`payment-method-card ${selectedPaymentMethod === 'cod' ? 'selected' : ''}`}
                    onClick={() => setSelectedPaymentMethod('cod')}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={selectedPaymentMethod === 'cod'}
                      onChange={() => setSelectedPaymentMethod('cod')}
                    />
                    <div className="payment-method-info">
                      <span className="provider-badge cod">
                        Cash on Delivery
                      </span>
                      <span className="payment-type">Pay when you receive</span>
                    </div>
                  </div>

                  {/* eWallet Payment Methods */}
                  {paymentMethods.length === 0 ? (
                    <p className="no-ewallet-notice">eWallet payment options coming soon</p>
                  ) : (
                    paymentMethods.map((method) => (
                      <div
                        key={method._id}
                        className={`payment-method-card ${selectedPaymentMethod?._id === method._id ? 'selected' : ''}`}
                        onClick={() => setSelectedPaymentMethod(method)}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethod?._id === method._id}
                          onChange={() => setSelectedPaymentMethod(method)}
                        />
                        <div className="payment-method-info">
                          <span className={`provider-badge ${method.serviceProvider.toLowerCase()}`}>
                            {method.serviceProvider}
                          </span>
                          <span className="payment-account-number">
                            {method.accountNumber.slice(0, -4).replace(/\d/g, '*') + method.accountNumber.slice(-4)}
                          </span>
                          <span className="payment-type">{method.type}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedPaymentMethod && selectedPaymentMethod !== 'cod' && (
                      <div className="payment-details">
                        <div className="qr-section">
                          <h3>Scan QR Code to Pay</h3>
                          <div className="qr-container">
                            <img 
                              src={selectedPaymentMethod.qrImage} 
                              alt={`${selectedPaymentMethod.serviceProvider} QR Code`}
                              className="qr-code-image"
                            />
                          </div>
                          <div className="account-details">
                            <p><strong>Account Name:</strong> {selectedPaymentMethod.accountName}</p>
                            <p><strong>Account Number:</strong> {selectedPaymentMethod.accountNumber}</p>
                          </div>
                        </div>

                        <div className="payment-form">
                          <h3>Payment Confirmation Details</h3>
                          
                          {!transactionScreenshot && (
                            <>
                              <div className="form-group">
                                <label>Reference Number *</label>
                                <input
                                  type="text"
                                  name="referenceNumber"
                                  value={paymentInfo.referenceNumber}
                                  onChange={handlePaymentInfoChange}
                                  placeholder="Enter transaction reference number"
                                  required
                                />
                                <small className="form-hint">Enter the reference number from your payment receipt</small>
                              </div>
                              <div className="form-group">
                                <label>Sender Number *</label>
                                <input
                                  type="text"
                                  name="senderNumber"
                                  value={paymentInfo.senderNumber}
                                  onChange={handlePaymentInfoChange}
                                  placeholder="+639123456789"
                                  required
                                />
                                <small className="form-hint">Your {selectedPaymentMethod.serviceProvider} mobile number (format: +63XXXXXXXXXX)</small>
                              </div>
                              <div className="form-group">
                                <label>Sender Name *</label>
                                <input
                                  type="text"
                                  name="senderName"
                                  value={paymentInfo.senderName}
                                  onChange={handlePaymentInfoChange}
                                  placeholder="Enter your name as registered in your account"
                                  required
                                />
                                <small className="form-hint">Name registered in your {selectedPaymentMethod.serviceProvider} account</small>
                              </div>

                              {/* OR Divider */}
                              <div className="or-divider">
                                <span>OR</span>
                              </div>
                            </>
                          )}

                          {/* Screenshot Upload Section */}
                          <div className="screenshot-upload-section">
                            {!screenshotPreview ? (
                              <>
                                <label className="upload-label">Upload Transaction Screenshot</label>
                                <input
                                  type="file"
                                  name="transactionScreenshot"
                                  onChange={handleScreenshotChange}
                                  accept=".jpg,.jpeg,.png"
                                  className="file-input"
                                  id="screenshot-upload"
                                  style={{ display: 'none' }}
                                />
                                <label htmlFor="screenshot-upload" className="btn-upload-screenshot">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                  </svg>
                                  Upload Transaction Screenshot
                                </label>
                                <small className="form-hint">Upload a screenshot of your payment receipt instead of filling the form above</small>
                              </>
                            ) : (
                              <div className="screenshot-preview-container">
                                <label className="upload-label">Transaction Screenshot</label>
                                <div className="screenshot-preview">
                                  <img src={screenshotPreview} alt="Transaction Screenshot" />
                                  <button 
                                    type="button" 
                                    onClick={removeScreenshot} 
                                    className="btn-remove-screenshot"
                                    title="Remove screenshot"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </button>
                                </div>
                                <small className="form-hint success-hint">Screenshot uploaded! Manual fields are now optional.</small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
              </div>

              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₱{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>₱{calculateTotal() > 50 ? '0.00' : '10.00'}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₱{(calculateTotal() + (calculateTotal() > 50 ? 0 : 10)).toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handleCheckout} className="btn btn-success btn-large">
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
