import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';

interface ImageRegenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (customizations: any) => Promise<void>;
  basePrompt: string;
  isLoading?: boolean;
}

export function ImageRegenerationModal({
  isOpen,
  onClose,
  onRegenerate,
  basePrompt,
  isLoading = false
}: ImageRegenerationModalProps) {
  const [angle, setAngle] = useState('');
  const [detail, setDetail] = useState('');
  const [style, setStyle] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const handleRegenerate = async () => {
    await onRegenerate({
      angle,
      detail,
      style,
      additionalDetails
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Regenerate Step Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Camera Angle</Label>
            <Select value={angle} onValueChange={setAngle}>
              <SelectTrigger>
                <SelectValue placeholder="Select angle..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default</SelectItem>
                <SelectItem value="close-up">Close-up</SelectItem>
                <SelectItem value="wide angle">Wide Angle</SelectItem>
                <SelectItem value="top-down">Top-Down</SelectItem>
                <SelectItem value="side">Side View</SelectItem>
                <SelectItem value="isometric">Isometric</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Detail Level</Label>
            <Select value={detail} onValueChange={setDetail}>
              <SelectTrigger>
                <SelectValue placeholder="Select detail level..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default</SelectItem>
                <SelectItem value="photorealistic high detail">Photorealistic High Detail</SelectItem>
                <SelectItem value="technical precision">Technical Precision</SelectItem>
                <SelectItem value="professional product photo">Professional Product Photo</SelectItem>
                <SelectItem value="annotated with part numbers">Annotated with Part Numbers</SelectItem>

              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Visual Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select style..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default</SelectItem>
                <SelectItem value="photorealistic modern parts">Photorealistic Modern Parts</SelectItem>
                <SelectItem value="technical diagram with exact details">Technical Diagram (Exact Details)</SelectItem>
                <SelectItem value="professional repair manual photo">Professional Repair Manual</SelectItem>
                <SelectItem value="3D render modern components">3D Render (Modern Components)</SelectItem>
                <SelectItem value="cutaway view showing internals">Cutaway View (Internals)</SelectItem>

              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional Details</Label>
            <Textarea
              placeholder="Add any specific details you want to see..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Base Prompt:</p>
            <p className="text-muted-foreground">{basePrompt}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRegenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Regenerate Image
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}