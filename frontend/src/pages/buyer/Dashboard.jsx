import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, Package, TrendingUp, Clock, LogOut } from 'lucide-react';
import axios from 'axios';

const BuyerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDemands = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/buyer/demands`,
        { withCredentials: true }
      );
      setDemands(data);
    } catch (error) {
      console.error('Error fetching demands:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const stats = {
    totalDemands: demands.length,
    activeDemands: demands.filter(d => d.status === 'open').length,
    totalOffers: demands.reduce((sum, d) => sum + (d.offer_count || 0), 0)
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-bold text-[#002FA7]" data-testid="logo">BidifyX</Link>
              <div className="flex gap-4">
                <Link to="/buyer/dashboard" className="text-[#002FA7] font-semibold" data-testid="dashboard-link">Dashboard</Link>
                <Link to="/products" className="text-[#4B5563] hover:text-[#002FA7]" data-testid="products-link">Products</Link>
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#0A0A0A]" data-testid="dashboard-heading">Welcome, {user?.name}</h1>
            <p className="text-[#4B5563] mt-2">Manage your demands and find the best offers</p>
          </div>
          <Link to="/buyer/post-demand">
            <Button className="btn-primary" data-testid="post-demand-btn">
              <Plus className="h-5 w-5 mr-2" />
              Post New Demand
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="card-hover border border-black/5" data-testid="total-demands-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#4B5563]">Total Demands</CardTitle>
              <Package className="h-4 w-4 text-[#002FA7]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0A0A0A]">{stats.totalDemands}</div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-black/5" data-testid="active-demands-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#4B5563]">Active Demands</CardTitle>
              <Clock className="h-4 w-4 text-[#10B981]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0A0A0A]">{stats.activeDemands}</div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-black/5" data-testid="total-offers-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#4B5563]">Total Offers Received</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#F59E0B]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0A0A0A]">{stats.totalOffers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Demands List */}
        <div>
          <h2 className="text-2xl font-bold text-[#0A0A0A] mb-4">Your Demands</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002FA7] mx-auto"></div>
            </div>
          ) : demands.length === 0 ? (
            <Card className="text-center py-12" data-testid="no-demands-card">
              <CardContent>
                <Package className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
                <p className="text-[#4B5563] mb-4">You haven't posted any demands yet</p>
                <Link to="/buyer/post-demand">
                  <Button className="btn-primary" data-testid="post-first-demand-btn">Post Your First Demand</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {demands.map((demand) => (
                <Card key={demand.demand_id} className="card-hover border border-black/5" data-testid={`demand-card-${demand.demand_id}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-[#0A0A0A]">{demand.title}</h3>
                          {demand.status === 'open' ? (
                            <span className="trust-badge bg-[#D1FAE5] text-[#065F46]" data-testid={`status-${demand.demand_id}`}>OPEN</span>
                          ) : (
                            <span className="trust-badge bg-[#FEE2E2] text-[#991B1B]" data-testid={`status-${demand.demand_id}`}>CLOSED</span>
                          )}
                        </div>
                        <p className="text-[#4B5563] mb-3">{demand.description}</p>
                        <div className="flex gap-4 text-sm text-[#4B5563]">
                          <span>Budget: PKR {demand.budget}</span>
                          <span>Duration: {demand.duration}</span>
                          <span>{demand.offer_count || 0} offers received</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/buyer/demands/${demand.demand_id}/offers`}>
                          <Button variant="outline" data-testid={`view-offers-btn-${demand.demand_id}`}>
                            View Offers ({demand.offer_count || 0})
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
