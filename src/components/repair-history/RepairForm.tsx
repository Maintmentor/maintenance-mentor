import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface RepairFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RepairForm({ onSuccess, onCancel }: RepairFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    actual_cost: '',
    difficulty_level: '',
    time_spent: '',
    notes: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const categories = [
    'Automotive', 'Home Appliances', 'Electronics', 'Plumbing', 'HVAC',
    'Electrical', 'Carpentry', 'Painting', 'Roofing', 'Landscaping', 'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 10)); // Limit to 10 photos
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const photoUrls: string[] = [];
    
    for (const photo of photos) {
      const fileName = `${Date.now()}-${photo.name}`;
      const { data, error } = await supabase.storage
        .from('repair-photos')
        .upload(fileName, photo);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('repair-photos')
        .getPublicUrl(fileName);
      
      photoUrls.push(publicUrl);
    }
    
    return photoUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const photoUrls = photos.length > 0 ? await uploadPhotos() : [];
      
      const { error } = await supabase
        .from('repair_history')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : null,
          difficulty_level: formData.difficulty_level ? parseInt(formData.difficulty_level) : null,
          time_spent: formData.time_spent ? parseInt(formData.time_spent) : null,
          notes: formData.notes,
          tags,
          photos: photoUrls,
        });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error saving repair:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Completed Repair</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Repair Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Fixed leaking kitchen faucet"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what was repaired and how..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select onValueChange={(value) => handleInputChange('difficulty_level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="1-5 scale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Easy</SelectItem>
                  <SelectItem value="2">2 - Easy</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - Hard</SelectItem>
                  <SelectItem value="5">5 - Very Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost">Actual Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.actual_cost}
                onChange={(e) => handleInputChange('actual_cost', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="time">Time Spent (minutes)</Label>
              <Input
                id="time"
                type="number"
                value={formData.time_spent}
                onChange={(e) => handleInputChange('time_spent', e.target.value)}
                placeholder="120"
              />
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer"
                       onClick={() => removeTag(tag)}>
                  {tag} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Photos</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload photos</p>
              </label>
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes, lessons learned, tips for next time..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || !formData.title}>
              {loading ? 'Saving...' : 'Save Repair'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}