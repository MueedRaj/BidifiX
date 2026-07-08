import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';

// ✅ FIX: Use Vite env variable instead of process.env
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const PostDemand = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [formData, setFormData] = useState({
    product_id: '',
    title: '',
    description: '',
    budget: '',
    duration: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const { data } = await axios.get(`${BACKEND_URL}/api/products`);
      console.log('✅ Products fetched:', data);
      setProducts(data);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setError('Failed to load products. Please refresh the page.');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ Validation
    if (!formData.product_id) {
      setError('Please select a product/service');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        product_id: formData.product_id,
        title: formData.title,
        description: formData.description,
        budget: parseFloat(formData.budget),
        duration: formData.duration
      };

      console.log('📤 Submitting demand:', payload);

      await axios.post(
        `${BACKEND_URL}/api/buyer/demands`,
        payload,
        { withCredentials: true }
      );
      navigate('/buyer/dashboard');
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.detail || 'Failed to post demand');
    } finally {
      setLoading(false);
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

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[#0A0A0A] mb-2" data-testid="page-heading">Post a New Demand</h1>
        <p className="text-[#4B5563] mb-8">Tell sellers what subscription you need and receive multiple offers</p>

        {error && (
          <Alert variant="destructive" className="mb-6" data-testid="error-alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border border-black/5">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="post-demand-form">
              
              {/* ✅ Product/Service - FIXED with black placeholder */}
              <div>
                <Label htmlFor="product">Product / Service</Label>
                <Select 
                  value={formData.product_id} 
                  onValueChange={(value) => setFormData({...formData, product_id: value})} 
                  required
                >
                  <SelectTrigger 
                    className="mt-1 text-black data-[placeholder]:text-black" 
                    data-testid="product-select"
                  >
                    <SelectValue 
                      placeholder={loadingProducts ? "Loading products..." : "Select a product"} 
                      className="text-black placeholder:text-black"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {products.length === 0 && !loadingProducts ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No products available
                      </div>
                    ) : (
                      products.map((product) => (
                        <SelectItem 
                          key={product.product_id} 
                          value={product.product_id} 
                          data-testid={`product-option-${product.product_id}`}
                        >
                          {product.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ Title - black placeholder */}
              <div>
                <Label htmlFor="title">Demand Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Need ChatGPT Plus for 3 months"
                  required
                  className="mt-1 text-black placeholder:text-black"
                  data-testid="title-input"
                />
              </div>

              {/* ✅ Description - black placeholder */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your requirements in detail..."
                  rows={4}
                  required
                  className="mt-1 text-black placeholder:text-black"
                  data-testid="description-input"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* ✅ Budget - black placeholder */}
                <div>
                  <Label htmlFor="budget">Budget (PKR)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="5000"
                    required
                    min="0"
                    className="mt-1 text-black placeholder:text-black"
                    data-testid="budget-input"
                  />
                </div>

                {/* ✅ Duration - black placeholder */}
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="e.g., 3 months, 1 year"
                    required
                    className="mt-1 text-black placeholder:text-black"
                    data-testid="duration-input"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="btn-primary flex-1" disabled={loading} data-testid="submit-btn">
                  {loading ? 'Posting...' : 'Post Demand'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/buyer/dashboard')} data-testid="cancel-btn">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostDemand;