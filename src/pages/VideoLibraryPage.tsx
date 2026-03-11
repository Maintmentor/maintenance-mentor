import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Video as VideoIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VideoCard } from '@/components/video-library/VideoCard';
import { CategoryFilter } from '@/components/video-library/CategoryFilter';
import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';

interface AIVideo {
  id: string;
  title: string;
  category: string;
  duration: string;
  difficulty: string;
  thumbnail: string;
  views: number;
  rating: number;
  description: string;
  isBookmarked: boolean;
  progress: number;
  videoUrl: string;
}

export default function VideoLibraryPage() {
  const [videos, setVideos] = useState<AIVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_generated_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedVideos = data?.map(video => ({
        id: video.id,
        title: video.title,
        category: video.topic,
        duration: video.duration || '5:00',
        difficulty: video.difficulty || 'Beginner',
        thumbnail: video.thumbnail_url || 'https://via.placeholder.com/400x225',
        views: video.views || 0,
        rating: video.rating || 0,
        description: video.description || '',
        isBookmarked: video.is_bookmarked || false,
        progress: 0,
        videoUrl: video.video_url || ''
      })) || [];

      setVideos(formattedVideos);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Videos', count: videos.length },
    { id: 'plumbing', name: 'Plumbing', count: videos.filter(v => v.category === 'plumbing').length },
    { id: 'electrical', name: 'Electrical', count: videos.filter(v => v.category === 'electrical').length },
    { id: 'hvac', name: 'HVAC', count: videos.filter(v => v.category === 'hvac').length },
    { id: 'appliances', name: 'Appliances', count: videos.filter(v => v.category === 'appliances').length },
    { id: 'pool', name: 'Pool Maintenance', count: videos.filter(v => v.category === 'pool').length },
    { id: 'water_systems', name: 'Water Systems', count: videos.filter(v => v.category === 'water_systems').length },
    { id: 'general', name: 'General Repair', count: videos.filter(v => v.category === 'general').length }
  ];

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Generated Video Library</h1>
            <p className="text-gray-600">Browse maintenance tutorials created from your questions</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>

            <div className="lg:col-span-3">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading videos...</p>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <VideoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos yet</h3>
                  <p className="text-gray-600 mb-4">
                    Videos will appear here when you ask maintenance questions to the AI assistant
                  </p>
                  <Button onClick={() => window.location.href = '/dashboard'}>
                    Ask a Question
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
