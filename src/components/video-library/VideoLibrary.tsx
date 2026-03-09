import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, Star, Play } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { CategoryFilter } from './CategoryFilter';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_seconds: number;
  thumbnail_url: string;
  video_url: string;
  views: number;
  average_rating: number;
  total_ratings: number;
}

export const VideoLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Videos', count: 0 },
    { id: 'plumbing', name: 'Plumbing', count: 0 },
    { id: 'electrical', name: 'Electrical', count: 0 },
    { id: 'hvac', name: 'HVAC', count: 0 },
    { id: 'appliances', name: 'Appliances', count: 0 },
    { id: 'pool', name: 'Pool', count: 0 },
    { id: 'water_systems', name: 'Water Systems', count: 0 },
    { id: 'general', name: 'General Repair', count: 0 }
  ]);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading videos:', error);
      setLoading(false);
      return;
    }

    setVideos(data || []);
    
    // Update category counts
    const counts: Record<string, number> = {};
    data?.forEach(video => {
      counts[video.category] = (counts[video.category] || 0) + 1;
    });

    setCategories(prev => prev.map(cat => ({
      ...cat,
      count: cat.id === 'all' ? data?.length || 0 : counts[cat.id] || 0
    })));

    setLoading(false);
  };

  const filteredVideos = videos
    .filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          video.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.views - a.views;
        case 'rating':
          return b.average_rating - a.average_rating;
        case 'duration':
          return a.duration_seconds - b.duration_seconds;
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Library</h1>
          <p className="text-gray-600">Browse AI-generated maintenance tutorials created from your questions</p>
        </div>

        {/* Search and Filters */}
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
              <option value="duration">Shortest First</option>
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {/* Video Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos yet</h3>
                <p className="text-gray-600">Ask the AI assistant a maintenance question to generate your first tutorial video!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVideos.map((video) => {
                  const durationMins = Math.floor(video.duration_seconds / 60);
                  const durationSecs = video.duration_seconds % 60;
                  return (
                    <VideoCard 
                      key={video.id} 
                      video={{
                        id: video.id,
                        title: video.title,
                        category: video.category,
                        duration: `${durationMins}:${durationSecs.toString().padStart(2, '0')}`,
                        difficulty: video.difficulty,
                        thumbnail: video.thumbnail_url,
                        views: video.views,
                        rating: video.average_rating,
                        description: video.description,
                        isBookmarked: false,
                        progress: 0,
                        videoUrl: video.video_url
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
