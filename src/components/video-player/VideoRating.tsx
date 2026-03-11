import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface VideoRatingProps {
  videoId: string;
  currentRating: number;
  totalRatings: number;
}

export const VideoRating: React.FC<VideoRatingProps> = ({ videoId, currentRating, totalRatings }) => {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserRating();
  }, [videoId]);

  const loadUserRating = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('video_ratings')
      .select('rating')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .single();

    if (data) setUserRating(data.rating);
  };

  const handleRating = async (rating: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'Please sign in to rate videos', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('video_ratings')
        .upsert({
          video_id: videoId,
          user_id: user.id,
          rating
        });

      if (error) throw error;

      setUserRating(rating);
      toast({ title: 'Success', description: 'Rating submitted!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={loading}
            className="transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoverRating || userRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-600">
        {currentRating > 0 ? (
          <>
            <span className="font-semibold">{currentRating.toFixed(1)}</span>
            <span className="text-gray-400"> ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})</span>
          </>
        ) : (
          <span className="text-gray-400">No ratings yet</span>
        )}
      </div>
    </div>
  );
};