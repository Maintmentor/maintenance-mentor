import { Badge } from '@/components/ui/badge';
import { Languages, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TranslationFeedbackButtons } from './TranslationFeedbackButtons';

interface TranslationIndicatorProps {
  isTranslating?: boolean;
  sourceLang?: string;
  targetLang?: string;
  cached?: boolean;
  confidence?: number;
  translationId?: string;
  originalText?: string;
  translatedText?: string;
}


export function TranslationIndicator({ 
  isTranslating, 
  sourceLang, 
  targetLang,
  cached,
  confidence,
  translationId,
  originalText,
  translatedText
}: TranslationIndicatorProps) {
  if (!isTranslating && !sourceLang) return null;

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1">
              {isTranslating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="h-3 w-3" />
                  {sourceLang} → {targetLang}
                  {cached && ' (cached)'}
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {isTranslating ? (
              <p>Translating your message...</p>
            ) : (
              <p>
                Message translated from {sourceLang} to {targetLang}
                {cached && ' using cached translation'}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {!isTranslating && translationId && originalText && translatedText && (
        <TranslationFeedbackButtons
          translationId={translationId}
          originalText={originalText}
          translatedText={translatedText}
          confidence={confidence}
        />
      )}
    </div>
  );
}

