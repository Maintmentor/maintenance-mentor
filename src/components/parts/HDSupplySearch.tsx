import { useState } from 'react';
import { Search, ExternalLink, Package, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface HDSupplyProduct {
  name: string;
  partNumber: string;
  price: string;
  availability: string;
  url: string;
}

export function HDSupplySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<HDSupplyProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('hd-supply-scraper', {
        body: { searchQuery }
      });

      if (error) throw error;

      setProducts(data.products || []);
      
      if (data.products?.length === 0) {
        toast.info('No products found. Try a different search term.');
      } else {
        toast.success(`Found ${data.products.length} products`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search HD Supply');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            HD Supply Parts Search
          </CardTitle>
          <CardDescription>
            Search for maintenance and repair parts from HD Supply
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search for parts (e.g., pool pump, filter, valve)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {products.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                {product.partNumber && (
                  <Badge variant="outline" className="w-fit">
                    {product.partNumber}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {product.price && (
                  <div className="flex items-center gap-2 text-lg font-bold text-green-600">
                    <DollarSign className="h-4 w-4" />
                    {product.price}
                  </div>
                )}
                {product.availability && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    {product.availability}
                  </div>
                )}
                {product.url && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`https://www.hdsupplysolutions.com${product.url}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on HD Supply
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}