import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../config/axios';
import './Navbar.css';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('userRole') === 'admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const location = useLocation();

  // Get user name from localStorage
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token && isLoggedIn) {
        try {
          const response = await api.get('/api/users/profile');
          if (response.data && response.data.name) {
            setUserName(response.data.name);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    
    fetchUserData();
  }, [isLoggedIn]);

  // Calculate cart item count
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
      setCartItemCount(totalItems);
    };

    // Update cart count on mount and when location changes
    updateCartCount();

    // Listen for cart updates
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setProfileDropdownOpen(false);
    window.location.href = '/';
  };

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <span className="logo-text">
            Furni<span className="logo-highlight">Shop</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <ul className="navbar-menu">
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/shop" className={isActive('/shop') ? 'active' : ''}>
              Shop
            </Link>
          </li>
          <li>
            <Link to="/custom-furniture" className={isActive('/custom-furniture') ? 'active' : ''}>
              Custom
            </Link>
          </li>
          {/* Cart Icon - Always visible for all users */}
          <li>
            <Link to="/checkout" className={`cart-icon-link ${isActive('/checkout') ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </Link>
          </li>
          {isLoggedIn ? (
            <>
              <li className="profile-dropdown-container">
                <button 
                  className="profile-avatar-btn" 
                  onClick={toggleProfileDropdown}
                  aria-label="Profile menu"
                >
                  <div className="avatar-circle-nav">
                    {getInitials(userName)}
                  </div>
                </button>
                {profileDropdownOpen && (
                  <div className="profile-dropdown">
                    <Link 
                      to={isAdmin ? "/admin" : "/user-dashboard"} 
                      className="dropdown-item"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      Dashboard
                    </Link>
                    <button onClick={handleLogout} className="dropdown-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </li>
            </>
          ) : (
            <li>
              <Link to="/login" className="btn-signin">
                Sign In
              </Link>
            </li>
          )}
        </ul>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <Link 
            to="/" 
            className={isActive('/') ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/shop" 
            className={isActive('/shop') ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Shop
          </Link>
          <Link 
            to="/custom-furniture" 
            className={isActive('/custom-furniture') ? 'active' : ''}
            onClick={() => setMobileMenuOpen(false)}
          >
            Custom
          </Link>
          {/* Cart Link - Always visible for all users */}
          <Link 
            to="/checkout" 
            className={`mobile-cart-link ${isActive('/checkout') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Cart</span>
            {cartItemCount > 0 && (
              <span className="mobile-cart-badge">{cartItemCount}</span>
            )}
          </Link>
          {isLoggedIn ? (
            <>
              <Link 
                to={isAdmin ? "/admin" : "/user-dashboard"}
                className={isActive(isAdmin ? '/admin' : '/user-dashboard') || isActive('/admin-dashboard') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button onClick={handleLogout} className="mobile-btn-logout">
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className="mobile-btn-signin"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
