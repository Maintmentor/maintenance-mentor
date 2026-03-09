import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, AlertCircle, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ImageDisplayProps {
  url: string;
  query: string;
  source: string;
  verificationScore?: number;
  onRetry?: () => void;
}

export function ImageDisplay({ url, query, source, verificationScore, onRetry }: ImageDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  const handleRetry = async () => {
    if (onRetry) {
      setRetrying(true);
      await onRetry();
      setRetrying(false);
    }
  };

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Try direct URL first, then fallback to proxy if needed
  const imageUrl = url.startsWith('http') ? url : `https://kudlclzjfihbphehhiii.supabase.co/storage/v1/object/public/image-cache/${encodeURIComponent(url)}`;

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-gray-50">
        {loading && !error && (
          <div className="flex items-center justify-center h-48 bg-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center h-48 bg-yellow-50 p-4">
            <AlertCircle className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="text-sm text-yellow-800 text-center mb-3">
              Unable to load image directly
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={openInNewTab}
                className="text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View on {source}
              </Button>
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="text-xs"
                >
                  {retrying ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}
        
        {!error && (
          <img
            src={imageUrl}
            alt={query}
            className={`w-full h-auto max-h-96 object-contain ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>
      
      <div className="p-3 border-t bg-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{source}</span>
            {verificationScore && (
              <Badge 
                variant={verificationScore >= 0.7 ? "default" : "secondary"} 
                className="text-xs"
              >
                {Math.round(verificationScore * 100)}% match
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600 truncate">{query}</p>
      </div>
    </Card>
  );
}