import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  estimated_time: number;
  tags: string[];
}

interface RelatedArticlesProps {
  currentArticle: {
    id: string;
    category: string;
    tags: string[];
  };
}

export default function RelatedArticles({ currentArticle }: RelatedArticlesProps) {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetchRelatedArticles();
  }, [currentArticle.id]);

  const fetchRelatedArticles = async () => {
    // Fetch articles from same category or with matching tags
    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .select('id, title, slug, category, excerpt, estimated_time, tags')
      .eq('published', true)
      .neq('id', currentArticle.id)
      .or(`category.eq.${currentArticle.category},tags.ov.{${currentArticle.tags.join(',')}}`)
      .limit(3);

    if (!error && data) {
      setArticles(data);
    }
  };

  if (articles.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6" />
        Related Articles
      </h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link key={article.id} to={`/knowledge-base/${article.slug}`}>
            <Card className="p-6 h-full hover:shadow-lg transition-shadow cursor-pointer">
              <Badge variant="outline" className="mb-3">{article.category}</Badge>
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {article.estimated_time}m read
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
