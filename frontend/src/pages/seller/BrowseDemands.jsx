import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';

const BrowseDemands = () => {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [offerData, setOfferData] = useState({ price: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDemands = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/seller/demands`,
        { withCredentials: true }
      );
      setDemands(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands]);

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/seller/demands/${selectedDemand.demand_id}/offer`,
        { price: parseFloat(offerData.price), description: offerData.description },
        { withCredentials: true }
      );
      alert('Offer submitted successfully!');
      setSelectedDemand(null);
      setOfferData({ price: '', description: '' });
      fetchDemands();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to submit offer');
    } finally {
      setSubmitting(false);
    }
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
        <h1 className="text-4xl font-bold text-[#0A0A0A] mb-8" data-testid="page-heading">Browse Demands</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002FA7] mx-auto"></div>
          </div>
        ) : demands.length === 0 ? (
          <Card className="text-center py-12" data-testid="no-demands-card">
            <CardContent>
              <p className="text-[#4B5563]">No active demands available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {demands.map((demand) => (
              <Card key={demand.demand_id} className="card-hover border border-black/5" data-testid={`demand-card-${demand.demand_id}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#0A0A0A] mb-2">{demand.title}</h3>
                      <p className="text-[#4B5563] mb-3">{demand.description}</p>
                      <div className="flex gap-4 text-sm text-[#4B5563]">
                        <span>Product: {demand.product_name}</span>
                        <span>Budget: PKR {demand.budget}</span>
                        <span>Duration: {demand.duration}</span>
                      </div>
                    </div>
                    <Button
                      className="btn-primary"
                      onClick={() => setSelectedDemand(demand)}
                      data-testid={`submit-offer-btn-${demand.demand_id}`}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Offer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedDemand} onOpenChange={(open) => !open && setSelectedDemand(null)}>
        <DialogContent data-testid="offer-dialog">
          <DialogHeader>
            <DialogTitle>Submit Your Offer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitOffer} className="space-y-4">
            <div>
              <Label>Your Price (PKR)</Label>
              <Input
                type="number"
                value={offerData.price}
                onChange={(e) => setOfferData({...offerData, price: e.target.value})}
                placeholder="5000"
                required
                min="0"
                data-testid="offer-price-input"
              />
            </div>
            <div>
              <Label>Offer Description</Label>
              <Textarea
                value={offerData.description}
                onChange={(e) => setOfferData({...offerData, description: e.target.value})}
                placeholder="Describe what you're offering..."
                rows={4}
                required
                data-testid="offer-description-input"
              />
            </div>
            <Button type="submit" className="w-full btn-primary" disabled={submitting} data-testid="submit-offer-modal-btn">
              {submitting ? 'Submitting...' : 'Submit Offer'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseDemands;
