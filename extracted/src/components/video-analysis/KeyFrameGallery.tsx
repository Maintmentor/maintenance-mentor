import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getKeyFrames, extractKeyFrames, downloadFrame, exportAllFramesAsZip } from '@/services/keyFrameExtractor';
import { Image, Star, Download, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KeyFrameGalleryProps {
  analysisId: string;
}

export const KeyFrameGallery = ({ analysisId }: KeyFrameGalleryProps) => {
  const [keyFrames, setKeyFrames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadKeyFrames();
  }, [analysisId]);

  const loadKeyFrames = async () => {
    const frames = await getKeyFrames(analysisId);
    if (frames.length === 0) {
      await handleExtract();
    } else {
      setKeyFrames(frames);
    }
  };

  const handleExtract = async () => {
    setLoading(true);
    try {
      const frames = await extractKeyFrames(analysisId);
      setKeyFrames(frames);
      toast({
        title: 'Key frames extracted',
        description: `Successfully extracted ${frames.length} key frames with images`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to extract key frames',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFrame = async (frame: any) => {
    if (!frame.frame_image_url) return;
    try {
      await downloadFrame(frame.frame_image_url, frame.frame_number);
      toast({
        title: 'Downloaded',
        description: `Frame ${frame.frame_number} downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download frame',
        variant: 'destructive',
      });
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      await exportAllFramesAsZip(keyFrames);
      toast({
        title: 'Exported',
        description: `All ${keyFrames.length} frames exported as ZIP`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export frames',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Key Frames</h3>
            <Badge variant="secondary">{keyFrames.length} frames</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportAll}
              disabled={exporting || keyFrames.length === 0}
              variant="outline"
              size="sm"
            >
              <Package className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export All as ZIP'}
            </Button>
            <Button
              onClick={handleExtract}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? 'Extracting...' : 'Re-extract Frames'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {keyFrames.map((frame, idx) => (
            <div key={idx} className="relative group">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {frame.frame_image_url ? (
                  <img
                    src={frame.frame_image_url}
                    alt={`Frame ${frame.frame_number}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {(frame.importance_score * 100).toFixed(0)}
                </Badge>
              </div>
              <Button
                onClick={() => handleDownloadFrame(frame)}
                variant="secondary"
                size="icon"
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="h-4 w-4" />
              </Button>
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium">{formatTime(frame.timestamp_seconds)}</p>
                <p className="text-xs text-muted-foreground">
                  {frame.detected_objects?.length || 0} objects detected
                </p>
              </div>
            </div>
          ))}
        </div>

        {keyFrames.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No key frames extracted yet</p>
          </div>
        )}
      </div>
    </Card>
  );
};
