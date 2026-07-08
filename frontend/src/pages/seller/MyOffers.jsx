import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

const MyOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/seller/my-offers`,
        { withCredentials: true }
      );
      setOffers(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const getStatusBadge = (status) => {
    if (status === 'accepted') return <Badge className="bg-[#10B981] text-white">Accepted</Badge>;
    if (status === 'rejected') return <Badge className="bg-[#EF4444] text-white">Rejected</Badge>;
    return <Badge className="bg-[#F59E0B] text-white">Pending</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-[#002FA7]" data-testid="logo">BidifyX</Link>
            <Link to="/seller/dashboard">
              <Button variant="ghost" data-testid="back-btn">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[#0A0A0A] mb-8" data-testid="page-heading">My Offers</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002FA7] mx-auto"></div>
          </div>
        ) : offers.length === 0 ? (
          <Card className="text-center py-12" data-testid="no-offers-card">
            <CardContent>
              <p className="text-[#4B5563]">You haven't submitted any offers yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {offers.map((offer) => (
              <Card key={offer.offer_id} className="card-hover border border-black/5" data-testid={`offer-card-${offer.offer_id}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-[#0A0A0A]">{offer.demand?.title || 'Demand'}</h3>
                        {getStatusBadge(offer.status)}
                      </div>
                      <p className="text-[#4B5563] mb-3">{offer.description}</p>
                      <div className="flex gap-4 text-sm text-[#4B5563]">
                        <span className="font-bold text-[#002FA7]">Your Price: PKR {offer.price}</span>
                        <span>Buyer Budget: PKR {offer.demand?.budget}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOffers;
