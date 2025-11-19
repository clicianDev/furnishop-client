import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import Model3DViewerPage from './pages/Model3DViewerPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import CustomFurniturePage from './pages/CustomFurniturePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminTransactionsPage from './pages/AdminTransactionsPage';
import AdminPaymentMethods from './pages/AdminPaymentMethods';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ReturnsPage from './pages/ReturnsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes with Navbar and Footer */}
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/3d-viewer/:id" element={<Model3DViewerPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/user-dashboard" element={<UserDashboard />} />
                  <Route path="/custom-furniture" element={<CustomFurniturePage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/returns" element={<ReturnsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                </Routes>
                <Footer />
                <MobileBottomNav />
              </>
            }
          />

          {/* Admin Routes with AdminLayout */}
          <Route
            path="/admin/*"
            element={
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/products" element={<AdminProductsPage />} />
                  <Route path="/users" element={<AdminUsersPage />} />
                  <Route path="/transactions" element={<AdminTransactionsPage />} />
                  <Route path="/payment-methods" element={<AdminPaymentMethods />} />
                </Routes>
              </AdminLayout>
            }
          />

          {/* Legacy admin-dashboard route for backward compatibility */}
          <Route
            path="/admin-dashboard"
            element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
