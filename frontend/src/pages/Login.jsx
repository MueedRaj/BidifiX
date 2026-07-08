import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(location.state?.error || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      const from = location.state?.from?.pathname || '/buyer/dashboard';
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Load Google Identity Services once (keeps UI/layout unchanged)
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

  const handleGoogleLogin = async (role) => {
    try {
      // Ensure GIS is ready
      if (!window.google?.accounts?.id) {
        setError('Google login is not ready yet. Please try again.');
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError('Google login is not configured on this app.');
        return;
      }

      // Initialize token client
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
              { credential, role },
              { withCredentials: true }
            );

            if (data.role === 'buyer') navigate('/buyer/dashboard', { replace: true });
            else if (data.role === 'seller') navigate('/seller/dashboard', { replace: true });
            else navigate('/admin/dashboard', { replace: true });
          } catch (e) {
            const msg = e.response?.data?.detail || e.message;
            setError(msg || 'Something went wrong. Please try again.');
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-bold text-[#002FA7]" data-testid="logo-link">BidifyX</Link>
            <h2 className="mt-6 text-3xl font-bold text-[#0A0A0A]">Welcome Back</h2>
            <p className="mt-2 text-[#4B5563]">Login to continue to your account</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4" data-testid="error-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@example.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? 'Logging in...' : 'Login'}
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

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleGoogleLogin('buyer')}
                data-testid="google-login-buyer-btn"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                As Buyer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleGoogleLogin('seller')}
                data-testid="google-login-seller-btn"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                As Seller
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-[#4B5563]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#002FA7] font-semibold hover:underline" data-testid="register-link">
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block flex-1 bg-[#002FA7] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#002FA7] to-[#001a5c]"></div>
        <div className="relative h-full flex items-center justify-center p-12">
          <div className="text-white">
            <h2 className="text-5xl font-bold mb-6">Digital Subscriptions,<br/>Simplified</h2>
            <p className="text-xl opacity-90">Join hundreds of buyers finding the best deals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;