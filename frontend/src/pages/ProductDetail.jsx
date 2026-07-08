import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, Package, TrendingUp } from 'lucide-react';
import axios from 'axios';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProduct = useCallback(async () => {
    try {
      const [productRes, demandsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products/${slug}`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products/${slug}/demands`)
      ]);
      setProduct(productRes.data);
      setDemands(demandsRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002FA7]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <p>Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-[#002FA7]" data-testid="logo">BidifyX</Link>
            <Link to="/products">
              <Button variant="ghost" data-testid="back-btn">
                <ArrowLeft className="h-4 w-4 mr-2" />
                All Products
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border border-black/5 mb-8">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-[#002FA7]/10 rounded-md flex items-center justify-center mb-6">
                  <Package className="h-8 w-8 text-[#002FA7]" />
                </div>
                <h1 className="text-4xl font-bold text-[#0A0A0A] mb-4" data-testid="product-name">{product.name}</h1>
                <p className="text-lg text-[#4B5563] mb-6">{product.description}</p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="font-bold text-[#0A0A0A] mb-2">Average Market Price</h3>
                    <p className="text-3xl font-bold text-[#002FA7]" data-testid="product-price">PKR {product.avg_price}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A0A0A] mb-2">Active Demands</h3>
                    <p className="text-3xl font-bold text-[#10B981]" data-testid="active-demands">{product.active_demands || 0}</p>
                  </div>
                </div>

                {product.features && product.features.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-[#0A0A0A] mb-4">Features</h3>
                    <ul className="space-y-2">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-[#4B5563]">
                          <span className="w-1.5 h-1.5 bg-[#002FA7] rounded-full"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {user?.role === 'buyer' && (
                  <Button className="btn-primary" onClick={() => navigate('/buyer/post-demand')} data-testid="post-demand-btn">
                    Post Demand for This Product
                  </Button>
                )}
              </CardContent>
            </Card>

            {product.faq && product.faq.length > 0 && (
              <Card className="border border-black/5">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6">FAQs</h2>
                  <div className="space-y-4">
                    {product.faq.map((item) => (
                      <div key={item.q}>
                        <h3 className="font-bold text-[#0A0A0A] mb-2">{item.q}</h3>
                        <p className="text-[#4B5563]">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="border border-black/5">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-[#0A0A0A] mb-4">Recent Demands</h2>
                {demands.length === 0 ? (
                  <p className="text-[#4B5563] text-sm">No active demands</p>
                ) : (
                  <div className="space-y-4">
                    {demands.slice(0, 5).map((demand) => (
                      <div key={demand.demand_id} className="border-b border-[#E5E7EB] pb-4 last:border-0" data-testid={`demand-item-${demand.demand_id}`}>
                        <h3 className="font-semibold text-[#0A0A0A] text-sm mb-1">{demand.title}</h3>
                        <p className="text-xs text-[#4B5563] mb-2 line-clamp-2">{demand.description}</p>
                        <span className="text-xs font-bold text-[#002FA7]">Budget: PKR {demand.budget}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;