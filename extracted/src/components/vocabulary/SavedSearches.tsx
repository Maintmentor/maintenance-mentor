import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { vocabularySearchService, SavedSearch, SearchFilters } from '@/services/vocabularySearchService';
import { Save, Search, Trash2, Clock } from 'lucide-react';

interface SavedSearchesProps {
  currentFilters: SearchFilters;
  onLoadSearch: (filters: SearchFilters) => void;
}

export const SavedSearches: React.FC<SavedSearchesProps> = ({
  currentFilters,
  onLoadSearch
}) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const searches = await vocabularySearchService.getSavedSearches();
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return;
    
    try {
      await vocabularySearchService.saveSearch(searchName.trim(), currentFilters);
      setSearchName('');
      setSaveDialogOpen(false);
      loadSavedSearches();
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  const handleLoadSearch = async (search: SavedSearch) => {
    try {
      await vocabularySearchService.updateSearchUsage(search.id);
      onLoadSearch(search.filters);
      loadSavedSearches();
    } catch (error) {
      console.error('Failed to load search:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Searches</h3>
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Search</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
              />
              <Button onClick={handleSaveSearch} className="w-full">
                Save Search
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {savedSearches.map((search) => (
          <Card key={search.id} className="cursor-pointer hover:bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{search.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    Used {search.use_count} times
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleLoadSearch(search)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {savedSearches.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No saved searches yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};