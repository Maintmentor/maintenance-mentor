import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface DiagramEditModalProps {
  diagram: {
    id: string;
    title: string;
    description: string;
    category: string;
    notes: string;
  };
  onClose: () => void;
  onSave: () => void;
}

export function DiagramEditModal({ diagram, onClose, onSave }: DiagramEditModalProps) {
  const [title, setTitle] = useState(diagram.title);
  const [description, setDescription] = useState(diagram.description || '');
  const [category, setCategory] = useState(diagram.category);
  const [notes, setNotes] = useState(diagram.notes || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const categories = ['plumbing', 'electrical', 'hvac', 'appliances', 'general', 'other'];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('saved_diagrams')
        .update({
          title,
          description,
          category,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', diagram.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Diagram updated successfully',
      });
      onSave();
    } catch (error) {
      console.error('Error updating diagram:', error);
      toast({
        title: 'Error',
        description: 'Failed to update diagram',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Diagram</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter diagram title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the diagram"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes or reminders"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
