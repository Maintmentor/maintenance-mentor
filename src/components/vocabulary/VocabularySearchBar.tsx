import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { vocabularySearchService, SearchSuggestion } from '@/services/vocabularySearchService';
import { Search, X, Clock, Tag, BookOpen, Filter } from 'lucide-react';

interface VocabularySearchBarProps {
  onSearch: (query: string) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  showRecentSearches?: boolean;
}

export const VocabularySearchBar: React.FC<VocabularySearchBarProps> = ({
  onSearch,
  onSuggestionSelect,
  placeholder = "Search terms, definitions, or categories...",
  showRecentSearches = true
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRecentSearches = () => {
      const saved = localStorage.getItem('vocabulary_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    };
    loadRecentSearches();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const searchSuggestions = await vocabularySearchService.getSearchSuggestions(query);
          setSuggestions(searchSuggestions);
        } catch (error) {
          console.error('Failed to load suggestions:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      addToRecentSearches(searchQuery.trim());
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const addToRecentSearches = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('vocabulary_recent_searches', JSON.stringify(updated));
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.value);
    onSuggestionSelect(suggestion);
    handleSearch(suggestion.value);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('vocabulary_recent_searches');
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'term':
        return <BookOpen className="h-4 w-4" />;
      case 'category':
        return <Tag className="h-4 w-4" />;
      case 'recent':
        return <Clock className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            } else if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            onClick={() => handleSearch()}
            size="sm"
            className="h-7"
          >
            Search
          </Button>
        </div>
      </div>

      {showSuggestions && (suggestions.length > 0 || (showRecentSearches && recentSearches.length > 0)) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-2">
            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.value}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div className="text-gray-400">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.value}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {suggestion.type}
                        {suggestion.count && ` • ${suggestion.count} terms`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {showRecentSearches && recentSearches.length > 0 && suggestions.length === 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Recent Searches
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-auto p-0 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </Button>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={`recent-${search}-${index}`}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="flex-1">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="px-2 py-4 text-center text-sm text-gray-500">
                Loading suggestions...
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};