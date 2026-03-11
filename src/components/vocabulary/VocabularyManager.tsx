import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { vocabularyService, VocabularyTerm } from '@/services/vocabularyService';
import { vocabularySearchService, SearchFilters } from '@/services/vocabularySearchService';
import { VocabularySearchBar } from './VocabularySearchBar';
import { AdvancedFilters } from './AdvancedFilters';
import { SavedSearches } from './SavedSearches';
import { DocumentImporter } from './DocumentImporter';
import { ImportHistoryViewer } from './ImportHistoryViewer';
import { VocabularyAnalyticsDashboard } from './VocabularyAnalyticsDashboard';
import { BookOpen, Play, Plus, Upload, Users, Star, FileText, Sparkles, BarChart3 } from 'lucide-react';
export const VocabularyManager: React.FC = () => {
  const [terms, setTerms] = useState<VocabularyTerm[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<VocabularyTerm[]>([]);
  const [reviewTerms, setReviewTerms] = useState<VocabularyTerm[]>([]);
  const [stats, setStats] = useState({ totalTerms: 0, masteredTerms: 0, reviewsDue: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [recommendedTerms, setRecommendedTerms] = useState<VocabularyTerm[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [termsData, reviewData, statsData] = await Promise.all([
        vocabularyService.getTerms({ verified_only: true }),
        vocabularyService.getReviewTerms(),
        vocabularyService.getUserStats()
      ]);
      setTerms(termsData);
      setReviewTerms(reviewData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load vocabulary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (termId: string, isCorrect: boolean) => {
    try {
      await vocabularyService.updateProgress(termId, isCorrect);
      await loadData();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading vocabulary...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Vocabulary Manager</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalTerms}</p>
                  <p className="text-sm text-gray-600">Total Terms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.masteredTerms}</p>
                  <p className="text-sm text-gray-600">Mastered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.reviewsDue}</p>
                  <p className="text-sm text-gray-600">Due for Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.streak}</p>
                  <p className="text-sm text-gray-600">Best Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="review">Review ({stats.reviewsDue})</TabsTrigger>
          <TabsTrigger value="browse">Browse Terms</TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <VocabularyAnalyticsDashboard />
        </TabsContent>
        <TabsContent value="import" className="space-y-4">
          <DocumentImporter onTermsImported={loadData} />
          <ImportHistoryViewer />
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          {reviewTerms.length > 0 ? (
            reviewTerms.map((term) => (
              <Card key={term.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{term.term}</span>
                    <Badge variant="outline">Level {term.difficulty_level}</Badge>
                  </CardTitle>
                  {term.phonetic_transcription && (
                    <p className="text-sm text-gray-600">/{term.phonetic_transcription}/</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{term.definition}</p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleReview(term.id, true)} className="bg-green-600">
                      Correct
                    </Button>
                    <Button onClick={() => handleReview(term.id, false)} variant="outline">
                      Incorrect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">No terms due for review!</p>
                <Button className="mt-4" onClick={loadData}>
                  Check Again
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <div className="space-y-4">
            <VocabularySearchBar
              onSearch={(query) => setSearchFilters({ ...searchFilters, query })}
              onSuggestionSelect={(suggestion) => {
                if (suggestion.type === 'category') {
                  setSearchFilters({ ...searchFilters, categories: [suggestion.value] });
                } else {
                  setSearchFilters({ ...searchFilters, query: suggestion.value });
                }
              }}
            />
            
            <div className="flex gap-4">
              <AdvancedFilters
                filters={searchFilters}
                onFiltersChange={setSearchFilters}
                onClearFilters={() => setSearchFilters({})}
              />
            </div>

            <div className="grid gap-4">
              {(filteredTerms.length > 0 ? filteredTerms : terms).slice(0, 20).map((term) => (
                <Card key={term.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{term.term}</span>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{term.category}</Badge>
                        <Badge variant="outline">Level {term.difficulty_level}</Badge>
                      </div>
                    </CardTitle>
                    {term.phonetic_transcription && (
                      <p className="text-sm text-gray-600">/{term.phonetic_transcription}/</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p>{term.definition}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="collections">
          <div className="grid lg:grid-cols-2 gap-6">
            <SavedSearches
              currentFilters={searchFilters}
              onLoadSearch={setSearchFilters}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Recommended Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendedTerms.slice(0, 5).map((term) => (
                    <div key={term.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{term.term}</span>
                        <p className="text-sm text-gray-600">{term.definition.slice(0, 60)}...</p>
                      </div>
                      <Badge variant="outline">Level {term.difficulty_level}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collections">
          <Card>
            <CardHeader>
              <CardTitle>Vocabulary Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Collections feature coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Term</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Term
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Import Glossary</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV/JSON
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};