import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { SearchFilters, vocabularySearchService } from '@/services/vocabularySearchService';
import { Filter, X, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    equipmentTypes: [] as string[],
    tags: [] as string[],
    difficultyLevels: [1, 2, 3, 4, 5]
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const options = await vocabularySearchService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const updateFilters = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilters(key, newArray.length > 0 ? newArray : undefined);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.difficulty?.length) count++;
    if (filters.categories?.length) count++;
    if (filters.equipmentTypes?.length) count++;
    if (filters.masteryStatus?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.isVerified !== undefined) count++;
    if (filters.dateRange) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Advanced Filters</CardTitle>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Difficulty Level */}
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.difficultyLevels.map(level => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`difficulty-${level}`}
                        checked={filters.difficulty?.includes(level) || false}
                        onCheckedChange={() => toggleArrayFilter('difficulty', level.toString())}
                      />
                      <label htmlFor={`difficulty-${level}`} className="text-sm">
                        Level {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-medium mb-2 block">Categories</label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {filterOptions.categories.slice(0, 8).map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={filters.categories?.includes(category) || false}
                        onCheckedChange={() => toggleArrayFilter('categories', category)}
                      />
                      <label htmlFor={`category-${category}`} className="text-sm capitalize">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment Types */}
              {filterOptions.equipmentTypes.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Equipment Types</label>
                  <div className="space-y-2">
                    {filterOptions.equipmentTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`equipment-${type}`}
                          checked={filters.equipmentTypes?.includes(type) || false}
                          onCheckedChange={() => toggleArrayFilter('equipmentTypes', type)}
                        />
                        <label htmlFor={`equipment-${type}`} className="text-sm capitalize">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mastery Status */}
              <div>
                <label className="text-sm font-medium mb-2 block">Learning Status</label>
                <div className="space-y-2">
                  {[
                    { value: 'new', label: 'New Terms' },
                    { value: 'learning', label: 'Learning' },
                    { value: 'review', label: 'Due for Review' },
                    { value: 'mastered', label: 'Mastered' }
                  ].map(status => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={filters.masteryStatus?.includes(status.value as any) || false}
                        onCheckedChange={() => toggleArrayFilter('masteryStatus', status.value)}
                      />
                      <label htmlFor={`status-${status.value}`} className="text-sm">
                        {status.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Status */}
              <div>
                <label className="text-sm font-medium mb-2 block">Verification</label>
                <Select
                  value={filters.isVerified === undefined ? 'all' : filters.isVerified.toString()}
                  onValueChange={(value) => 
                    updateFilters('isVerified', value === 'all' ? undefined : value === 'true')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    <SelectItem value="true">Verified Only</SelectItem>
                    <SelectItem value="false">Unverified Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date Added</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start text-left">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange?.from ? format(filters.dateRange.from, 'MMM dd') : 'From'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange?.from}
                        onSelect={(date) => 
                          updateFilters('dateRange', {
                            ...filters.dateRange,
                            from: date
                          })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start text-left">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange?.to ? format(filters.dateRange.to, 'MMM dd') : 'To'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange?.to}
                        onSelect={(date) => 
                          updateFilters('dateRange', {
                            ...filters.dateRange,
                            to: date
                          })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.difficulty?.map(level => (
            <Badge key={`diff-${level}`} variant="secondary" className="text-xs">
              Level {level}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => toggleArrayFilter('difficulty', level.toString())}
              />
            </Badge>
          ))}
          {filters.categories?.map(category => (
            <Badge key={`cat-${category}`} variant="secondary" className="text-xs">
              {category}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => toggleArrayFilter('categories', category)}
              />
            </Badge>
          ))}
          {filters.masteryStatus?.map(status => (
            <Badge key={`status-${status}`} variant="secondary" className="text-xs">
              {status}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => toggleArrayFilter('masteryStatus', status)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};