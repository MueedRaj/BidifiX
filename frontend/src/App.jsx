import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import './index.css';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerDashboard from './pages/buyer/Dashboard';
import PostDemand from './pages/buyer/PostDemand';
import ViewOffers from './pages/buyer/ViewOffers';
import SellerDashboard from './pages/seller/Dashboard';
import BrowseDemands from './pages/seller/BrowseDemands';
import MyOffers from './pages/seller/MyOffers';
import SubscriptionPlans from './pages/seller/SubscriptionPlans';
import SubscriptionSuccess from './pages/seller/SubscriptionSuccess';
import ProductCatalog from './pages/ProductCatalog';
import ProductDetail from './pages/ProductDetail';
import AdminDashboard from './pages/admin/Dashboard';

// Role constants to avoid inline array creation
const BUYER_ROLES = ['buyer'];
const SELLER_ROLES = ['seller'];
const ADMIN_ROLES = ['admin'];

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<ProductCatalog />} />
      <Route path="/products/:slug" element={<ProductDetail />} />
      
      <Route path="/buyer/dashboard" element={
        <ProtectedRoute roles={BUYER_ROLES}>
          <BuyerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/buyer/post-demand" element={
        <ProtectedRoute roles={BUYER_ROLES}>
          <PostDemand />
        </ProtectedRoute>
      } />
      <Route path="/buyer/demands/:demandId/offers" element={
        <ProtectedRoute roles={BUYER_ROLES}>
          <ViewOffers />
        </ProtectedRoute>
      } />
      
      <Route path="/seller/dashboard" element={
        <ProtectedRoute roles={SELLER_ROLES}>
          <SellerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/seller/demands" element={
        <ProtectedRoute roles={SELLER_ROLES}>
          <BrowseDemands />
        </ProtectedRoute>
      } />
      <Route path="/seller/offers" element={
        <ProtectedRoute roles={SELLER_ROLES}>
          <MyOffers />
        </ProtectedRoute>
      } />
      <Route path="/seller/subscription" element={
        <ProtectedRoute roles={SELLER_ROLES}>
          <SubscriptionPlans />
        </ProtectedRoute>
      } />
      <Route path="/seller/subscription/success" element={
        <ProtectedRoute roles={SELLER_ROLES}>
          <SubscriptionSuccess />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={ADMIN_ROLES}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;