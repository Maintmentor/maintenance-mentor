import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, CheckCircle, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { translationRetrainingService } from '@/services/translationRetrainingService';


interface FeedbackItem {
  id: string;
  translation_id: string;
  rating: number;
  suggested_correction: string;
  feedback_comment: string;
  is_reviewed: boolean;
  created_at: string;
  translation_cache: {
    source_text: string;
    source_language: string;
    target_language: string;
    translated_text: string;
    confidence_score: number;
  };
}

export function TranslationFeedbackDashboard() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unreviewed' | 'negative'>('unreviewed');
  const [retraining, setRetraining] = useState(false);


  useEffect(() => {
    loadFeedback();
  }, [filter]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('translation_feedback')
        .select(`
          *,
          translation_cache (
            source_text,
            source_language,
            target_language,
            translated_text,
            confidence_score
          )
        `)
        .order('created_at', { ascending: false });

      if (filter === 'unreviewed') {
        query = query.eq('is_reviewed', false);
      } else if (filter === 'negative') {
        query = query.eq('rating', -1);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (id: string, applyToML: boolean = false) => {
    try {
      const { error } = await supabase
        .from('translation_feedback')
        .update({
          is_reviewed: true,
          applied_to_ml: applyToML,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(applyToML ? 'Added to ML training data' : 'Marked as reviewed');
      loadFeedback();
    } catch (error) {
      toast.error('Failed to update feedback');
    }
  };

  const handleTriggerRetraining = async () => {
    setRetraining(true);
    try {
      await translationRetrainingService.triggerRetraining();
      toast.success('Model retraining started successfully');
    } catch (error) {
      toast.error('Failed to start retraining');
    } finally {
      setRetraining(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Feedback
          </Button>
          <Button
            variant={filter === 'unreviewed' ? 'default' : 'outline'}
            onClick={() => setFilter('unreviewed')}
          >
            Unreviewed
          </Button>
          <Button
            variant={filter === 'negative' ? 'default' : 'outline'}
            onClick={() => setFilter('negative')}
          >
            Negative Only
          </Button>
        </div>
        <Button onClick={handleTriggerRetraining} disabled={retraining}>
          <Zap className="w-4 h-4 mr-2" />
          {retraining ? 'Retraining...' : 'Trigger ML Retraining'}
        </Button>
      </div>


      {loading ? (
        <p>Loading feedback...</p>
      ) : feedback.length === 0 ? (
        <p className="text-muted-foreground">No feedback found</p>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {item.rating === 1 ? (
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <ThumbsDown className="h-5 w-5 text-red-600" />
                    )}
                    {item.translation_cache.source_language} → {item.translation_cache.target_language}
                  </CardTitle>
                  {item.is_reviewed && (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Reviewed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Original Text</p>
                    <p className="text-sm text-muted-foreground">{item.translation_cache.source_text}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">AI Translation</p>
                    <p className="text-sm text-muted-foreground">{item.translation_cache.translated_text}</p>
                  </div>
                </div>

                {item.suggested_correction && (
                  <div>
                    <p className="text-sm font-medium text-green-600">Suggested Correction</p>
                    <p className="text-sm">{item.suggested_correction}</p>
                  </div>
                )}

                {item.feedback_comment && (
                  <div>
                    <p className="text-sm font-medium">Comment</p>
                    <p className="text-sm text-muted-foreground">{item.feedback_comment}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline">
                    Confidence: {(item.translation_cache.confidence_score * 100).toFixed(0)}%
                  </Badge>
                  {!item.is_reviewed && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsReviewed(item.id, false)}
                      >
                        Mark Reviewed
                      </Button>
                      {item.suggested_correction && (
                        <Button
                          size="sm"
                          onClick={() => markAsReviewed(item.id, true)}
                        >
                          Apply to ML
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
