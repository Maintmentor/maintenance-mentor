import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { translationService } from '@/services/translationService';
import { useAuth } from '@/contexts/AuthContext';

interface TranslationFeedbackButtonsProps {
  translationId?: string;
  originalText: string;
  translatedText: string;
  confidence?: number;
}

export function TranslationFeedbackButtons({
  translationId,
  originalText,
  translatedText,
  confidence
}: TranslationFeedbackButtonsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [correction, setCorrection] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleRating = async (value: number) => {
    if (!translationId || !user) return;

    setRating(value);
    if (value === 1) {
      // Positive feedback - submit immediately
      await submitFeedback(value);
    } else {
      // Negative feedback - show dialog for details
      setShowDialog(true);
    }
  };

  const submitFeedback = async (ratingValue: number = rating!) => {
    if (!translationId || !user) return;

    setSubmitting(true);
    try {
      await translationService.submitFeedback(user.id, {
        translationId,
        rating: ratingValue,
        suggestedCorrection: correction || undefined,
        feedbackComment: comment || undefined
      });

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for helping improve translations!'
      });

      setShowDialog(false);
      setCorrection('');
      setComment('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!translationId) return null;

  return (
    <>
      <div className="flex items-center gap-2 text-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRating(1)}
          className={rating === 1 ? 'text-green-600' : ''}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRating(-1)}
          className={rating === -1 ? 'text-red-600' : ''}
        >
          <ThumbsDown className="h-3 w-3" />
        </Button>
        {confidence && (
          <span className="text-muted-foreground">
            {(confidence * 100).toFixed(0)}% confidence
          </span>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Improve Translation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Original</Label>
              <p className="text-sm">{originalText}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Translation</Label>
              <p className="text-sm">{translatedText}</p>
            </div>
            <div>
              <Label htmlFor="correction">Suggested Correction</Label>
              <Input
                id="correction"
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                placeholder="Enter better translation..."
              />
            </div>
            <div>
              <Label htmlFor="comment">Additional Comments</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What's wrong with this translation?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => submitFeedback()} disabled={submitting}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
