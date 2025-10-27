import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('userRole') === 'admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setIsAdmin(false);
    window.location.href = '/';
  };

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
          {isLoggedIn ? (
            <>
              <li>
                <Link to="/checkout" className={isActive('/checkout') ? 'active' : ''}>
                  Cart
                </Link>
              </li>
              <li>
                <Link to="/user-dashboard" className={isActive('/user-dashboard') ? 'active' : ''}>
                  Dashboard
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin-dashboard" className={isActive('/admin-dashboard') ? 'active' : ''}>
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
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
          {isLoggedIn ? (
            <>
              <Link 
                to="/checkout" 
                className={isActive('/checkout') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
              </Link>
              <Link 
                to="/user-dashboard" 
                className={isActive('/user-dashboard') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link 
                  to="/admin-dashboard" 
                  className={isActive('/admin-dashboard') ? 'active' : ''}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
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
