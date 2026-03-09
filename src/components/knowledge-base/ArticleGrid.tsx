import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, BookOpen, Video, HelpCircle, Wrench } from 'lucide-react';

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
  views: number;
}

interface ArticleGridProps {
  articles: Article[];
  loading: boolean;
}

const typeIcons = {
  article: BookOpen,
  video: Video,
  faq: HelpCircle,
  troubleshooting: Wrench,
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export default function ArticleGrid({ articles, loading }: ArticleGridProps) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-5/6"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <Card className="p-12 text-center">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No articles found</h3>
        <p className="text-slate-600">Try adjusting your filters or search query</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => {
        const TypeIcon = typeIcons[article.article_type as keyof typeof typeIcons];
        return (
          <Link key={article.id} to={`/knowledge-base/${article.slug}`}>
            <Card className="p-6 h-full hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="outline" className="text-xs">
                  {article.category}
                </Badge>
                <TypeIcon className="w-5 h-5 text-blue-600" />
              </div>
              
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-slate-900">
                {article.title}
              </h3>
              
              <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                {article.excerpt}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.estimated_time}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {article.views}
                  </span>
                </div>
                <Badge className={`text-xs ${difficultyColors[article.difficulty_level as keyof typeof difficultyColors]}`}>
                  {article.difficulty_level}
                </Badge>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
