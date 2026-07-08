import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData.email, formData.password, formData.name, formData.role);
    
    if (result.success) {
      if (formData.role === 'buyer') {
        navigate('/buyer/dashboard', { replace: true });
      } else {
        navigate('/seller/dashboard', { replace: true });
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (window.google?.accounts?.id) return;

    const existing = document.getElementById('google-identity-script');
    if (existing) return;

    const s = document.createElement('script');
    s.id = 'google-identity-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  const handleGoogleRegister = async () => {
    try {
      if (!window.google?.accounts?.id) {
        setError('Google login is not ready yet. Please try again.');
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError('Google login is not configured on this app.');
        return;
      }

      setLoading(true);

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (resp) => {
          try {
            if (resp?.error) {
              setError(resp.error_description || resp.error);
              return;
            }

            const credential = resp?.access_token || resp?.credential;
            if (!credential) {
              setError('Google token missing.');
              return;
            }

            const { data } = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`,
              { credential, role: formData.role },
              { withCredentials: true }
            );

            if (data.role === 'buyer') navigate('/buyer/dashboard', { replace: true });
            else if (data.role === 'seller') navigate('/seller/dashboard', { replace: true });
            else navigate('/admin/dashboard', { replace: true });
          } catch (e) {
            const msg = e.response?.data?.detail || e.message;
            setError(msg || 'Something went wrong. Please try again.');
          } finally {
            setLoading(false);
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (e) {
      setLoading(false);
      setError(e.response?.data?.detail || e.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block flex-1 bg-[#10B981] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#10B981] to-[#059669]"></div>
        <div className="relative h-full flex items-center justify-center p-12">
          <div className="text-white">
            <h2 className="text-5xl font-bold mb-6">Start Your Journey<br/>with BidifyX</h2>
            <p className="text-xl opacity-90">Join as a buyer or seller today</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-bold text-[#002FA7]" data-testid="logo-link">BidifyX</Link>
            <h2 className="mt-6 text-3xl font-bold text-[#0A0A0A]">Create Account</h2>
            <p className="mt-2 text-[#4B5563]">Join BidifyX marketplace</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4" data-testid="error-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="register-form">
            <div>
              <Label>I want to register as</Label>
              <RadioGroup value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})} className="mt-2" data-testid="role-selector">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="buyer" id="buyer" data-testid="role-buyer" />
                  <Label htmlFor="buyer" className="cursor-pointer">Buyer (Looking for subscriptions)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="seller" id="seller" data-testid="role-seller" />
                  <Label htmlFor="seller" className="cursor-pointer">Seller (Offering subscriptions)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your name"
                required
                className="mt-1"
                data-testid="name-input"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
                required
                className="mt-1"
                data-testid="email-input"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1"
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={loading}
              data-testid="register-submit-btn"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E7EB]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#F8F9FA] text-[#4B5563]">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleRegister}
              data-testid="google-register-btn"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          <p className="mt-6 text-center text-[#4B5563]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#002FA7] font-semibold hover:underline" data-testid="login-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;