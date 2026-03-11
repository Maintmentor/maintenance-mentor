import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Play, Image as ImageIcon, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { ImageRegenerationModal } from './ImageRegenerationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


interface Step {
  number: number;
  title: string;
  description: string;
  image?: string;
  imageUrl?: string;
  videoTimestamp?: number;
  warning?: string;
  tips?: string[];
  imageVersions?: Array<{
    url: string;
    version: number;
    customPrompt?: string;
  }>;
}

interface StepByStepGuideProps {
  steps: Step[];
  onVideoSeek?: (timestamp: number) => void;
  onImageClick?: (imageUrl: string) => void;
  onRegenerateImage?: (stepNumber: number, customizations: any) => Promise<void>;
  messageId?: string;
}


export function StepByStepGuide({ steps, onVideoSeek, onImageClick, onRegenerateImage, messageId }: StepByStepGuideProps) {
  const [regeneratingStep, setRegeneratingStep] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleOpenRegenerateModal = (step: Step) => {
    setSelectedStep(step);
    setIsModalOpen(true);
  };

  const handleRegenerate = async (customizations: any) => {
    if (!selectedStep || !onRegenerateImage) return;
    
    setIsRegenerating(true);
    try {
      await onRegenerateImage(selectedStep.number, customizations);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to regenerate image:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSelectVersion = (step: Step, versionUrl: string) => {
    if (onImageClick) {
      onImageClick(versionUrl);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-lg">Step-by-Step Instructions</h3>
      </div>
      
      {steps.map((step, index) => {
        const currentImage = step.imageUrl || step.image;
        const hasVersions = step.imageVersions && step.imageVersions.length > 0;
        
        return (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {step.number}
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <h4 className="font-semibold text-gray-900">{step.title}</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{step.description}</p>
                
                {step.warning && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{step.warning}</p>
                  </div>
                )}
                
                {step.tips && step.tips.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2">💡 Pro Tips:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {step.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  {currentImage && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onImageClick?.(currentImage)}
                        className="text-xs"
                      >
                        <ImageIcon className="w-3 h-3 mr-1" />
                        View Image
                      </Button>
                      
                      {onRegenerateImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenRegenerateModal(step)}
                          className="text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Regenerate
                        </Button>
                      )}
                      
                      {hasVersions && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs">
                              <ChevronDown className="w-3 h-3 mr-1" />
                              Versions ({step.imageVersions!.length})
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {step.imageVersions!.map((version, i) => (
                              <DropdownMenuItem
                                key={i}
                                onClick={() => handleSelectVersion(step, version.url)}
                              >
                                Version {version.version}
                                {version.customPrompt && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    (Custom)
                                  </span>
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  )}
                  
                  {step.videoTimestamp !== undefined && onVideoSeek && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onVideoSeek(step.videoTimestamp!)}
                      className="text-xs"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Watch Step
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {selectedStep && (
        <ImageRegenerationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRegenerate={handleRegenerate}
          basePrompt={selectedStep.description}
          isLoading={isRegenerating}
        />
      )}
    </div>
  );
}

export default StepByStepGuide;

