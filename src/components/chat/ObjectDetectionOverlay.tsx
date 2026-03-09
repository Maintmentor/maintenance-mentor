import { useEffect, useRef, useState } from 'react';
import { objectDetectionService, DetectedObject } from '@/services/objectDetectionService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ObjectDetectionOverlayProps {
  imageUrl: string;
  showOverlay?: boolean;
}

export function ObjectDetectionOverlay({ imageUrl, showOverlay = true }: ObjectDetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectObjects();
  }, [imageUrl]);

  const detectObjects = async () => {
    if (!imgRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await objectDetectionService.detectObjects(imgRef.current);
      setObjects(result.objects);
      
      if (showOverlay && canvasRef.current && imgRef.current) {
        drawBoundingBoxes(result.objects);
      }
    } catch (err) {
      setError('Failed to detect objects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const drawBoundingBoxes = (detectedObjects: DetectedObject[]) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detectedObjects.forEach((obj) => {
      const [x, y, width, height] = obj.bbox;
      
      ctx.strokeStyle = obj.score > 0.7 ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = obj.score > 0.7 ? '#10b981' : '#f59e0b';
      ctx.font = '16px Arial';
      const label = `${obj.class} ${(obj.score * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillRect(x, y - 25, textWidth + 10, 25);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 5, y - 7);
    });
  };

  return (
    <div className="relative">
      <div className="relative inline-block">
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Detection"
          className="max-w-full h-auto rounded-lg"
          onLoad={detectObjects}
          crossOrigin="anonymous"
        />
        {showOverlay && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      
      {!loading && objects.length > 0 && (
        <Card className="mt-4 p-4">
          <h4 className="font-semibold mb-2">Detected Objects ({objects.length})</h4>
          <div className="flex flex-wrap gap-2">
            {objects.map((obj, idx) => (
              <Badge 
                key={idx}
                variant={obj.score > 0.7 ? "default" : "secondary"}
              >
                {obj.class}: {(obj.score * 100).toFixed(0)}%
              </Badge>
            ))}
          </div>
        </Card>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-500">{error}</div>
      )}
    </div>
  );
}
