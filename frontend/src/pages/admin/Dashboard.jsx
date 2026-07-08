import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Users, ShoppingBag, Package, TrendingUp, LogOut, CheckCircle } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/stats`, { withCredentials: true }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users`, { withCredentials: true })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerifyUser = async (userId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/verify`,
        {},
        { withCredentials: true }
      );
      alert('User verified successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to verify user');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002FA7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-bold text-[#002FA7]" data-testid="logo">BidifyX Admin</Link>
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

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[#0A0A0A] mb-8" data-testid="dashboard-heading">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card className="card-hover border border-black/5" data-testid="total-users-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#4B5563]">Total Users</p>
                  <p className="text-3xl font-bold text-[#0A0A0A] mt-2">{stats?.total_users || 0}</p>
                </div>
                <Users className="h-8 w-8 text-[#002FA7]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-black/5" data-testid="total-buyers-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#4B5563]">Buyers</p>
                  <p className="text-3xl font-bold text-[#0A0A0A] mt-2">{stats?.total_buyers || 0}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-[#10B981]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-black/5" data-testid="total-sellers-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#4B5563]">Sellers</p>
                  <p className="text-3xl font-bold text-[#0A0A0A] mt-2">{stats?.total_sellers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-[#F59E0B]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-black/5" data-testid="total-demands-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#4B5563]">Demands</p>
                  <p className="text-3xl font-bold text-[#0A0A0A] mt-2">{stats?.total_demands || 0}</p>
                </div>
                <Package className="h-8 w-8 text-[#EF4444]" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-black/5" data-testid="total-offers-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#4B5563]">Offers</p>
                  <p className="text-3xl font-bold text-[#0A0A0A] mt-2">{stats?.total_offers || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-[#8B5CF6]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="border border-black/5">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6">Users Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#4B5563]">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#4B5563]">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#4B5563]">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#4B5563]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#4B5563]">Trust Score</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#4B5563]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-b border-[#E5E7EB] hover:bg-[#F8F9FA]" data-testid={`user-row-${u.user_id}`}>
                      <td className="py-3 px-4 text-sm">{u.name}</td>
                      <td className="py-3 px-4 text-sm">{u.email}</td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant={u.role === 'seller' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {u.verified ? (
                          <span className="trust-badge" data-testid={`verified-badge-${u.user_id}`}>
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            VERIFIED
                          </span>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{u.trust_score || 0}</td>
                      <td className="py-3 px-4 text-sm">
                        {!u.verified && u.role === 'seller' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyUser(u.user_id)}
                            data-testid={`verify-btn-${u.user_id}`}
                          >
                            Verify
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
