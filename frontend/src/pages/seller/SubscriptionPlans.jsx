import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Check, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const PLANS = {
  free: { name: 'Free', price: 0, bids: 5, features: ['5 bids per month', 'Basic support'] },
  basic: { name: 'Basic', price: 150, bids: 50, features: ['50 bids per month', 'Email support', 'Priority listing'] },
  pro: { name: 'Pro', price: 300, bids: 200, features: ['200 bids per month', 'Priority support', 'Featured seller badge', 'Analytics'] },
  agency: { name: 'Agency', price: 1000, bids: 9999, features: ['Unlimited bids', '24/7 support', 'Featured seller badge', 'Advanced analytics', 'Dedicated account manager'] }
};

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/seller/subscription`,
        { withCredentials: true }
      );
      setCurrentPlan(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleUpgrade = async (planKey) => {
    if (planKey === 'free') return;
    setCheckoutLoading(planKey);

    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/seller/subscription/checkout?plan=${planKey}`,
        {},
        { withCredentials: true, headers: { origin: window.location.origin } }
      );
      window.location.href = data.url;
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to initiate checkout');
      setCheckoutLoading(null);
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#0A0A0A] mb-4" data-testid="page-heading">Subscription Plans</h1>
          <p className="text-[#4B5563]">Choose the right plan to grow your business</p>
          {currentPlan && (
            <p className="text-[#002FA7] font-semibold mt-2">Current Plan: {currentPlan.plan.toUpperCase()}</p>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => (
            <Card
              key={key}
              className={`card-hover border ${
                currentPlan?.plan === key ? 'border-[#002FA7] border-2' : 'border-black/5'
              }`}
              data-testid={`plan-card-${key}`}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#0A0A0A]">PKR {plan.price}</span>
                  <span className="text-[#4B5563]">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-[#4B5563]">
                      <Check className="h-4 w-4 text-[#10B981] mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={currentPlan?.plan === key ? 'w-full' : 'w-full btn-primary'}
                  variant={currentPlan?.plan === key ? 'outline' : 'default'}
                  onClick={() => handleUpgrade(key)}
                  disabled={currentPlan?.plan === key || checkoutLoading === key || key === 'free'}
                  data-testid={`upgrade-btn-${key}`}
                >
                  {checkoutLoading === key
                    ? 'Processing...'
                    : currentPlan?.plan === key
                    ? 'Current Plan'
                    : key === 'free'
                    ? 'Free Plan'
                    : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;