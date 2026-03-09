import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DiagramEditModal } from './DiagramEditModal';

interface SavedDiagram {
  id: string;
  image_url: string;
  title: string;
  description: string;
  category: string;
  notes: string;
  prompt: string;
  created_at: string;
}

export function SavedDiagramsGallery() {
  const [diagrams, setDiagrams] = useState<SavedDiagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingDiagram, setEditingDiagram] = useState<SavedDiagram | null>(null);
  const { toast } = useToast();

  const categories = ['all', 'plumbing', 'electrical', 'hvac', 'appliances', 'general', 'other'];

  useEffect(() => {
    fetchDiagrams();
  }, []);

  const fetchDiagrams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_diagrams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiagrams(data || []);
    } catch (error) {
      console.error('Error fetching diagrams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved diagrams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDiagram = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_diagrams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDiagrams(diagrams.filter(d => d.id !== id));
      toast({
        title: 'Success',
        description: 'Diagram deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting diagram:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete diagram',
        variant: 'destructive',
      });
    }
  };

  const filteredDiagrams = selectedCategory === 'all'
    ? diagrams
    : diagrams.filter(d => d.category === selectedCategory);

  if (loading) {
    return <div className="text-center py-8">Loading diagrams...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="capitalize"
          >
            {cat}
          </Button>
        ))}
      </div>

      {filteredDiagrams.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No saved diagrams yet. Generate some diagrams in the chat to save them!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDiagrams.map(diagram => (
            <Card key={diagram.id} className="overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={diagram.image_url}
                  alt={diagram.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{diagram.title}</CardTitle>
                  <Badge variant="secondary" className="capitalize">
                    {diagram.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {diagram.description && (
                  <p className="text-sm text-muted-foreground">{diagram.description}</p>
                )}
                {diagram.notes && (
                  <p className="text-sm italic border-l-2 pl-2">{diagram.notes}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(diagram.image_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingDiagram(diagram)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteDiagram(diagram.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingDiagram && (
        <DiagramEditModal
          diagram={editingDiagram}
          onClose={() => setEditingDiagram(null)}
          onSave={() => {
            fetchDiagrams();
            setEditingDiagram(null);
          }}
        />
      )}
    </div>
  );
}
