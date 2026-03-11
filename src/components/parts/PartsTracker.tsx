import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HDSupplySearch } from './HDSupplySearch';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Package, Calendar, DollarSign, Truck, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Part {
  id: string;
  part_name: string;
  part_number: string;
  supplier: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  order_date: string;
  delivery_date: string;
  status: string;
  warranty_period: number;
  warranty_expiry: string;
  notes: string;
}

export default function PartsTracker() {
  const [parts, setParts] = useState<Part[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    part_name: '',
    part_number: '',
    supplier: '',
    quantity: '1',
    unit_cost: '',
    order_date: '',
    delivery_date: '',
    status: 'ordered',
    warranty_period: '',
    notes: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchParts();
    }
  }, [user]);

  const fetchParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts_tracking')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalCost = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const unitCost = parseFloat(formData.unit_cost) || 0;
    return quantity * unitCost;
  };

  const calculateWarrantyExpiry = () => {
    if (formData.delivery_date && formData.warranty_period) {
      const deliveryDate = new Date(formData.delivery_date);
      const warrantyMonths = parseInt(formData.warranty_period);
      deliveryDate.setMonth(deliveryDate.getMonth() + warrantyMonths);
      return deliveryDate.toISOString().split('T')[0];
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const totalCost = calculateTotalCost();
      const warrantyExpiry = calculateWarrantyExpiry();

      const { error } = await supabase
        .from('parts_tracking')
        .insert({
          user_id: user.id,
          part_name: formData.part_name,
          part_number: formData.part_number,
          supplier: formData.supplier,
          quantity: parseInt(formData.quantity),
          unit_cost: parseFloat(formData.unit_cost),
          total_cost: totalCost,
          order_date: formData.order_date,
          delivery_date: formData.delivery_date || null,
          status: formData.status,
          warranty_period: formData.warranty_period ? parseInt(formData.warranty_period) : null,
          warranty_expiry: warrantyExpiry,
          notes: formData.notes,
        });

      if (error) throw error;
      
      setFormData({
        part_name: '', part_number: '', supplier: '', quantity: '1',
        unit_cost: '', order_date: '', delivery_date: '', status: 'ordered',
        warranty_period: '', notes: ''
      });
      setShowForm(false);
      fetchParts();
    } catch (error) {
      console.error('Error adding part:', error);
    }
  };

  const updatePartStatus = async (partId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('parts_tracking')
        .update({ status: newStatus })
        .eq('id', partId);

      if (error) throw error;
      fetchParts();
    } catch (error) {
      console.error('Error updating part status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ordered': return <Clock className="h-4 w-4" />;
      case 'delivered': return <Truck className="h-4 w-4" />;
      case 'installed': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      case 'installed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading parts...</div>;
  }

  return (
    <Tabs defaultValue="tracker" className="space-y-6">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="tracker">Parts Tracker</TabsTrigger>
        <TabsTrigger value="search">HD Supply Search</TabsTrigger>
      </TabsList>

      <TabsContent value="tracker" className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Parts Tracker</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Part'}
          </Button>
        </div>


      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Part</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="part_name">Part Name *</Label>
                  <Input
                    id="part_name"
                    value={formData.part_name}
                    onChange={(e) => handleInputChange('part_name', e.target.value)}
                    placeholder="e.g., Brake Pads"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="part_number">Part Number</Label>
                  <Input
                    id="part_number"
                    value={formData.part_number}
                    onChange={(e) => handleInputChange('part_number', e.target.value)}
                    placeholder="e.g., BP-123-456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="e.g., AutoZone"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={(value) => handleInputChange('status', value)} defaultValue="ordered">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="installed">Installed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="unit_cost">Unit Cost ($)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => handleInputChange('unit_cost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <Input
                    value={`$${calculateTotalCost().toFixed(2)}`}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="order_date">Order Date</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => handleInputChange('order_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="warranty_period">Warranty (months)</Label>
                  <Input
                    id="warranty_period"
                    type="number"
                    value={formData.warranty_period}
                    onChange={(e) => handleInputChange('warranty_period', e.target.value)}
                    placeholder="12"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>

              <Button type="submit" disabled={!formData.part_name}>
                Add Part
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {parts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No parts tracked yet. Add your first part to get started!</p>
            </CardContent>
          </Card>
        ) : (
          parts.map((part) => (
            <Card key={part.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{part.part_name}</h3>
                    {part.part_number && (
                      <p className="text-sm text-gray-500">Part #: {part.part_number}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(part.status)}>
                    {getStatusIcon(part.status)}
                    <span className="ml-1 capitalize">{part.status}</span>
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Supplier</p>
                    <p className="font-medium">{part.supplier || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="font-medium">{part.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Cost</p>
                    <p className="font-medium">${part.total_cost?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Order Date</p>
                    <p className="font-medium">
                      {part.order_date ? new Date(part.order_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {part.warranty_expiry && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Warranty expires: {new Date(part.warranty_expiry).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {part.status !== 'installed' && (
                  <div className="mt-4 flex gap-2">
                    {part.status === 'ordered' && (
                      <Button size="sm" onClick={() => updatePartStatus(part.id, 'delivered')}>
                        Mark Delivered
                      </Button>
                    )}
                    {part.status === 'delivered' && (
                      <Button size="sm" onClick={() => updatePartStatus(part.id, 'installed')}>
                        Mark Installed
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </TabsContent>

      <TabsContent value="search">
        <HDSupplySearch />
      </TabsContent>
    </Tabs>
  );
}