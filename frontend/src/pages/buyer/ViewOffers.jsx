import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, CheckCircle, User } from 'lucide-react';
import axios from 'axios';

const ViewOffers = () => {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/buyer/demands/${demandId}/offers`,
        { withCredentials: true }
      );
      setOffers(data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  }, [demandId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleSelectOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to select this offer?')) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/buyer/demands/${demandId}/select-offer/${offerId}`,
        {},
        { withCredentials: true }
      );
      alert('Offer selected! You can now contact the seller.');
      navigate('/buyer/dashboard');
    } catch (error) {
      alert('Failed to select offer');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-[#002FA7]" data-testid="logo">BidifyX</Link>
            <Link to="/buyer/dashboard">
              <Button variant="ghost" data-testid="back-btn">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[#0A0A0A] mb-2" data-testid="page-heading">Offers for Your Demand</h1>
        <p className="text-[#4B5563] mb-8">Compare offers from verified sellers and select the best one</p>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002FA7] mx-auto"></div>
          </div>
        ) : offers.length === 0 ? (
          <Card className="text-center py-12" data-testid="no-offers-card">
            <CardContent>
              <p className="text-[#4B5563]">No offers received yet. Sellers will submit their offers soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {offers.map((offer) => (
              <Card key={offer.offer_id} className="card-hover border border-black/5" data-testid={`offer-card-${offer.offer_id}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-[#002FA7]/10 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-[#002FA7]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-[#0A0A0A]">{offer.seller?.name || 'Seller'}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {offer.seller?.verified && (
                              <span className="trust-badge" data-testid={`verified-badge-${offer.offer_id}`}>
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                VERIFIED
                              </span>
                            )}
                            <span className="text-sm text-[#4B5563]">Trust Score: {offer.seller?.trust_score || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#F8F9FA] p-4 rounded-md mb-4">
                        <div className="text-3xl font-bold text-[#002FA7] mb-1">PKR {offer.price}</div>
                        <p className="text-sm text-[#4B5563]">Offered Price</p>
                      </div>

                      <p className="text-[#4B5563] mb-4">{offer.description}</p>

                      <div className="text-sm text-[#9CA3AF]">
                        Submitted: {new Date(offer.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="ml-6">
                      {offer.status === 'accepted' ? (
                        <Badge className="bg-[#10B981] text-white" data-testid={`status-${offer.offer_id}`}>Selected</Badge>
                      ) : (
                        <Button
                          className="btn-primary"
                          onClick={() => handleSelectOffer(offer.offer_id)}
                          data-testid={`select-offer-btn-${offer.offer_id}`}
                        >
                          Select This Offer
                        </Button>
                      )}
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

export default ViewOffers;