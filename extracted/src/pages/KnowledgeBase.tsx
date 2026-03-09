import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import KnowledgeBaseSearch from '@/components/knowledge-base/KnowledgeBaseSearch';
import CategoryFilter from '@/components/knowledge-base/CategoryFilter';
import ArticleGrid from '@/components/knowledge-base/ArticleGrid';
import FeaturedArticles from '@/components/knowledge-base/FeaturedArticles';
import { BookOpen, Video, HelpCircle, Wrench } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  article_type: string;
  difficulty_level: string;
  estimated_time: number;
  tags: string[];
  featured: boolean;
  views: number;
}

export default function KnowledgeBase() {
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
    const category = searchParams.get('category');
    if (category) setSelectedCategory(category);
  }, [searchParams]);

  useEffect(() => {
    filterArticles();
  }, [articles, selectedCategory, selectedType, searchQuery]);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setArticles(data);
    }
    setLoading(false);
  };

  const filterArticles = () => {
    let filtered = [...articles];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(a => a.article_type === selectedType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.excerpt?.toLowerCase().includes(query) ||
        a.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(filtered);
  };

  const stats = [
    { icon: BookOpen, label: 'Articles', count: articles.filter(a => a.article_type === 'article').length },
    { icon: Video, label: 'Videos', count: articles.filter(a => a.article_type === 'video').length },
    { icon: HelpCircle, label: 'FAQs', count: articles.filter(a => a.article_type === 'faq').length },
    { icon: Wrench, label: 'Guides', count: articles.filter(a => a.article_type === 'troubleshooting').length },
  ];

  return (
    <>
      <Navigation />
      <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">


      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Knowledge Base</h1>
          <p className="text-xl text-blue-100 mb-8">Find answers, tutorials, and expert guides for all your repair needs</p>
          <KnowledgeBaseSearch onSearch={setSearchQuery} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <stat.icon className="w-8 h-8 text-blue-600 mb-2" />
              <div className="text-3xl font-bold text-slate-900">{stat.count}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <FeaturedArticles articles={articles.filter(a => a.featured)} />

        <div className="flex flex-col lg:flex-row gap-8 mt-12">
          <aside className="lg:w-64 flex-shrink-0">
            <CategoryFilter
              selectedCategory={selectedCategory}
              selectedType={selectedType}
              onCategoryChange={setSelectedCategory}
              onTypeChange={setSelectedType}
            />
          </aside>

          <main className="flex-1">
            <ArticleGrid articles={filteredArticles} loading={loading} />
          </main>
        </div>
      </div>
      </div>
      </ProtectedRoute>
    </>
  );
}


