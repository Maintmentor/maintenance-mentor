import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  estimated_time: number;
  difficulty_level: string;
}

interface FeaturedArticlesProps {
  articles: Article[];
}

export default function FeaturedArticles({ articles }: FeaturedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        <h2 className="text-2xl font-bold text-slate-900">Featured Articles</h2>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.slice(0, 4).map((article) => (
          <Link key={article.id} to={`/knowledge-base/${article.slug}`}>
            <Card className="p-6 h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <Badge className="mb-3 bg-yellow-500 text-white">Featured</Badge>
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-slate-900">
                {article.title}
              </h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <Badge variant="outline">{article.category}</Badge>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.estimated_time}m
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
