import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { TrendingUp, Package, DollarSign, LogOut, Award } from 'lucide-react';
import axios from 'axios';

const SellerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [offersRes, subRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/seller/my-offers`, { withCredentials: true }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/seller/subscription`, { withCredentials: true })
      ]);
      setOffers(offersRes.data);
      setSubscription(subRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const stats = {
    totalOffers: offers.length,
    acceptedOffers: offers.filter(o => o.status === 'accepted').length,
    pendingOffers: offers.filter(o => o.status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-bold text-[#002FA7]" data-testid="logo">BidifyX</Link>
              <div className="flex gap-4">
                <Link to="/seller/dashboard" className="text-[#002FA7] font-semibold" data-testid="dashboard-link">Dashboard</Link>
                <Link to="/seller/demands" className="text-[#4B5563] hover:text-[#002FA7]" data-testid="browse-demands-link">Browse Demands</Link>
                <Link to="/seller/subscription" className="text-[#4B5563] hover:text-[#002FA7]" data-testid="subscription-link">Subscription</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#4B5563]" data-testid="user-email">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="logout-btn">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#0A0A0A]" data-testid="dashboard-heading">Welcome, {user?.name}</h1>
            <p className="text-[#4B5563] mt-2">Manage your offers and grow your business</p>
          </div>
          {user?.verified && (
            <div className="trust-badge flex items-center gap-2" data-testid="verified-badge">
              <Award className="h-4 w-4" />
              VERIFIED SELLER
            </div>
          )}
        </div>

        {/* Subscription Alert */}
        {subscription && (
          <Card className="mb-8 border-2 border-[#002FA7]" data-testid="subscription-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-[#0A0A0A] mb-1">Current Plan: {subscription.plan.toUpperCase()}</h3>
                  <p className="text-[#4B5563]">
                    Bids Used: {subscription.bids_used} / {subscription.bid_limit}
                  </p>
                </div>
                <Link to="/seller/subscription">
                  <Button className="btn-primary" data-testid="upgrade-plan-btn">Upgrade Plan</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="card-hover border border-black/5" data-testid="total-offers-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#4B5563]">Total Offers</p>
                  <p className="text-3xl font-bold text-[#0A0A0A] mt-2">{stats.totalOffers}</p>
                </div>
                <Package className="h-8 w-8 text-[#002FA7]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-black/5" data-testid="accepted-offers-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#4B5563]">Accepted Offers</p>
                  <p className="text-3xl font-bold text-[#0A0A0A] mt-2">{stats.acceptedOffers}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-[#10B981]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-black/5" data-testid="pending-offers-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#4B5563]">Pending Offers</p>
                  <p className="text-3xl font-bold text-[#0A0A0A] mt-2">{stats.pendingOffers}</p>
                </div>
                <DollarSign className="h-8 w-8 text-[#F59E0B]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="card-hover border border-black/5" data-testid="browse-demands-card">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-[#002FA7] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#0A0A0A] mb-2">Browse Demands</h3>
              <p className="text-[#4B5563] mb-4">Find new demands and submit your offers</p>
              <Link to="/seller/demands">
                <Button className="btn-primary" data-testid="browse-demands-action-btn">Browse Now</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-hover border border-black/5" data-testid="my-offers-card">
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-[#10B981] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#0A0A0A] mb-2">My Offers</h3>
              <p className="text-[#4B5563] mb-4">Track all your submitted offers</p>
              <Link to="/seller/offers">
                <Button variant="outline" data-testid="view-offers-action-btn">View Offers</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;