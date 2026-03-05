import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Eye, ThumbsUp, Share2, BookOpen, ArrowLeft, Video } from 'lucide-react';
import RelatedArticles from '@/components/knowledge-base/RelatedArticles';
import { toast } from 'sonner';



interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  content: string;
  excerpt: string;
  tags: string[];
  article_type: string;
  video_url?: string;
  difficulty_level: string;
  estimated_time: number;
  views: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [helpful, setHelpful] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (!error && data) {
      setArticle(data);
      incrementViews(data.id);
    }
    setLoading(false);
  };

  const incrementViews = async (id: string) => {
    await supabase.rpc('increment_article_views', { article_id: id }).catch(() => {
      // Fallback if function doesn't exist
      supabase
        .from('knowledge_base_articles')
        .update({ views: (article?.views || 0) + 1 })
        .eq('id', id);
    });
  };

  const handleHelpful = async () => {
    if (!article || helpful) return;
    
    const { error } = await supabase
      .from('knowledge_base_articles')
      .update({ helpful_count: article.helpful_count + 1 })
      .eq('id', article.id);

    if (!error) {
      setHelpful(true);
      setArticle({ ...article, helpful_count: article.helpful_count + 1 });
      toast.success('Thanks for your feedback!');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="p-8 animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </Card>
          </div>
        </div>
        </ProtectedRoute>
      </>
    );
  }




  if (!article) {
    return (
      <>
        <Navigation />
        <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Article not found</h2>
            <Link to="/knowledge-base">
              <Button>Back to Knowledge Base</Button>
            </Link>
          </div>
        </div>
        </ProtectedRoute>
      </>
    );
  }




  return (
    <>
      <Navigation />
      <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">


      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/knowledge-base">
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Knowledge Base
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge>{article.category}</Badge>
            {article.subcategory && <Badge variant="outline">{article.subcategory}</Badge>}
            <Badge variant="secondary">{article.article_type}</Badge>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-4">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-6">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.estimated_time} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.views} views
            </span>
            <Badge className="bg-blue-100 text-blue-800">{article.difficulty_level}</Badge>
          </div>

          {article.video_url && (
            <div className="mb-8 rounded-lg overflow-hidden bg-slate-900">
              <div className="aspect-video flex items-center justify-center">
                <Video className="w-16 h-16 text-white" />
              </div>
            </div>
          )}

          <Separator className="my-8" />

          <div className="prose prose-slate max-w-none">
            {article.content.split('\n').map((para, i) => (
              <p key={i} className="mb-4 text-slate-700 leading-relaxed">{para}</p>
            ))}
          </div>

          <Separator className="my-8" />

          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary">#{tag}</Badge>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleHelpful}
              disabled={helpful}
              variant={helpful ? 'default' : 'outline'}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Helpful ({article.helpful_count})
            </Button>
            <Button onClick={handleShare} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </Card>

        <RelatedArticles currentArticle={article} />
      </div>
      </div>
      </ProtectedRoute>
    </>
  );
}

