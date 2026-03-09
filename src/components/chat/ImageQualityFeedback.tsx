import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Sparkles, Eye } from 'lucide-react';
import { imageFeedbackService } from '@/services/imageFeedbackService';
import { advancedMLService } from '@/services/advancedMLService';
import { ObjectDetectionOverlay } from './ObjectDetectionOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';



interface ImageQualityFeedbackProps {
  imageUrl: string;
  partName: string;
  partNumber?: string;
  searchQuery: string;
  mlScore?: number;
}

export default function ImageQualityFeedback({
  imageUrl,
  partName,
  partNumber,
  searchQuery,
  mlScore
}: ImageQualityFeedbackProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (type: 'positive' | 'negative') => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setFeedback(type);

    try {
      // Analyze image with advanced computer vision
      const advancedFeatures = await advancedMLService.analyzeImage(imageUrl);

      await imageFeedbackService.submitFeedback({
        part_number: partNumber || partName,
        image_url: imageUrl,
        search_query: searchQuery,
        feedback_type: type,
        ml_prediction_score: mlScore,
        advanced_features: advancedFeatures
      });

      toast.success(
        type === 'positive' 
          ? 'Thanks! This helps improve image quality.' 
          : 'Thanks! We\'ll work on better images.'
      );
    } catch (error) {
      console.error('Feedback error:', error);
      toast.error('Failed to submit feedback');
      setFeedback(null);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      {mlScore && mlScore > 0.8 && (
        <div className="flex items-center gap-1 text-xs text-purple-600 mr-2">
          <Sparkles className="h-3 w-3" />
          <span>ML Score: {(mlScore * 100).toFixed(0)}%</span>
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Image quality:</span>
        <Button
          size="sm"
          variant={feedback === 'positive' ? 'default' : 'outline'}
          className="h-7 px-2"
          onClick={() => handleFeedback('positive')}
          disabled={isSubmitting || feedback !== null}
        >
          <ThumbsUp className={`h-3 w-3 ${feedback === 'positive' ? 'fill-current' : ''}`} />
        </Button>
        <Button
          size="sm"
          variant={feedback === 'negative' ? 'destructive' : 'outline'}
          className="h-7 px-2"
          onClick={() => handleFeedback('negative')}
          disabled={isSubmitting || feedback !== null}
        >
          <ThumbsDown className={`h-3 w-3 ${feedback === 'negative' ? 'fill-current' : ''}`} />
        </Button>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 px-2">
            <Eye className="h-3 w-3 mr-1" />
            Detect Objects
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Object Detection Analysis</DialogTitle>
          </DialogHeader>
          <ObjectDetectionOverlay imageUrl={imageUrl} showOverlay={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
