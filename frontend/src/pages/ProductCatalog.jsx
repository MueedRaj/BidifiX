import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Package } from 'lucide-react';
import axios from 'axios';

const ProductCatalog = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products`),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/categories`)
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-[#002FA7]" data-testid="logo">BidifyX</Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link to={user.role === 'buyer' ? '/buyer/dashboard' : '/seller/dashboard'}>
                  <Button data-testid="dashboard-btn">Dashboard</Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button className="btn-primary" data-testid="login-btn">Login</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-[#0A0A0A] mb-4" data-testid="page-heading">Product Catalog</h1>
          <p className="text-lg text-[#4B5563] mb-8">Browse all available digital subscriptions</p>
          <div className="max-w-md mx-auto">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002FA7] mx-auto"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link key={product.product_id} to={`/products/${product.slug}`} data-testid={`product-card-${product.slug}`}>
                <Card className="card-hover border border-black/5 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-[#002FA7]/10 rounded-md flex items-center justify-center mb-4">
                      <Package className="h-6 w-6 text-[#002FA7]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0A0A0A] mb-2">{product.name}</h3>
                    <p className="text-sm text-[#4B5563] mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#4B5563]">Avg. Price</span>
                      <span className="font-bold text-[#002FA7]">PKR {product.avg_price}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCatalog;