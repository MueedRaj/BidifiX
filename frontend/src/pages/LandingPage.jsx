import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, Zap, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      if (user.role === 'buyer') navigate('/buyer/dashboard');
      else if (user.role === 'seller') navigate('/seller/dashboard');
      else navigate('/admin/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#002FA7]" data-testid="logo">BidifyX</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/products" className="text-[#4B5563] hover:text-[#002FA7] transition-colors" data-testid="products-link">
                Products
              </Link>
              {!user ? (
                <>
                  <Link to="/login" data-testid="login-link">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/register" data-testid="register-link">
                    <Button className="btn-primary" data-testid="get-started-header-btn">Get Started</Button>
                  </Link>
                </>
              ) : (
                <Link to={user.role === 'buyer' ? '/buyer/dashboard' : '/seller/dashboard'} data-testid="dashboard-link">
                  <Button className="btn-primary">Dashboard</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img
            src="https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-[#F8F9FA]/90"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-[#0A0A0A] tracking-tight mb-6" data-testid="hero-heading">
              Pakistan Ki Pehli Digital Subscription Marketplace
            </h1>
            <p className="text-lg text-[#4B5563] mb-8 max-w-2xl mx-auto">
              ChatGPT, CapCut, TradingView, Canva - Har subscription ke liye trusted sellers se competitive offers hasil karein
            </p>
            <div className="flex justify-center gap-4">
              <Button
                className="btn-primary px-8 py-6 text-lg"
                onClick={handleGetStarted}
                data-testid="get-started-hero-btn"
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link to="/products">
                <Button variant="outline" className="px-8 py-6 text-lg" data-testid="browse-products-btn">
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-[#0A0A0A] mb-12">Kyu BidifyX?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-hover bg-white border border-black/5 p-8 rounded-md shadow-sm" data-testid="feature-card-1">
              <div className="w-12 h-12 bg-[#002FA7]/10 rounded-md flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[#002FA7]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Sellers</h3>
              <p className="text-[#4B5563]">Sirf trusted aur verified sellers ke saath deal karein. Trust score aur reviews ke zariye.</p>
            </div>
            <div className="card-hover bg-white border border-black/5 p-8 rounded-md shadow-sm" data-testid="feature-card-2">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-md flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-[#10B981]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Best Prices</h3>
              <p className="text-[#4B5563]">Multiple sellers se offers compare karein aur best deal select karein.</p>
            </div>
            <div className="card-hover bg-white border border-black/5 p-8 rounded-md shadow-sm" data-testid="feature-card-3">
              <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-md flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#F59E0B]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Fast & Easy</h3>
              <p className="text-[#4B5563]">Demand post karein, offers receive karein, aur minutes mein deal complete karein.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-[#0A0A0A] mb-12">Kaise Kaam Karta Hai?</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#002FA7] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold mb-3">Post Your Demand</h3>
              <p className="text-[#4B5563]">Apni required subscription, budget aur details add karein</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#002FA7] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold mb-3">Receive Offers</h3>
              <p className="text-[#4B5563]">Verified sellers apni best offers submit karengi</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#002FA7] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold mb-3">Select & Deal</h3>
              <p className="text-[#4B5563]">Best offer select karein aur seller ke saath deal complete karein</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#002FA7] mb-2">100+</div>
              <div className="text-[#4B5563]">Verified Sellers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#002FA7] mb-2">500+</div>
              <div className="text-[#4B5563]">Active Demands</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#002FA7] mb-2">20+</div>
              <div className="text-[#4B5563]">Products</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#002FA7] mb-2">98%</div>
              <div className="text-[#4B5563]">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#002FA7] text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">Apni pehli demand abhi post karein ya seller banke earning start karein</p>
          <Button
            onClick={handleGetStarted}
            className="bg-white text-[#002FA7] hover:bg-gray-100 px-8 py-6 text-lg"
            data-testid="get-started-cta-btn"
          >
            Join BidifyX Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">BidifyX</h3>
              <p className="text-gray-400">Pakistan's first digital subscription marketplace</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/products">Browse Products</Link></li>
                <li><Link to="/register">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BidifyX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;