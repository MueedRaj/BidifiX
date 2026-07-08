import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);

  const checkPaymentStatus = useCallback(async () => {
    if (attempts >= 5) {
      setStatus('timeout');
      return;
    }

    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/seller/subscription/status/${sessionId}`,
        { withCredentials: true }
      );

      if (data.payment_status === 'paid') {
        setStatus('success');
      } else {
        setAttempts(prev => prev + 1);
        setTimeout(() => checkPaymentStatus(), 2000);
      }
    } catch (error) {
      setStatus('error');
    }
  }, [attempts, sessionId]);

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [sessionId, checkPaymentStatus]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <Card className="max-w-md w-full" data-testid="success-card">
        <CardContent className="p-8 text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="h-16 w-16 text-[#002FA7] mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2">Processing Payment...</h2>
              <p className="text-[#4B5563]">Please wait while we confirm your payment</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-[#10B981] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2" data-testid="success-heading">Payment Successful!</h2>
              <p className="text-[#4B5563] mb-6">Your subscription has been upgraded successfully.</p>
              <Link to="/seller/dashboard">
                <Button className="btn-primary" data-testid="dashboard-btn">Go to Dashboard</Button>
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-[#EF4444] mb-4">Payment verification failed. Please contact support.</p>
              <Link to="/seller/subscription">
                <Button variant="outline">Back to Plans</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;