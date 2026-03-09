import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Download, RotateCcw, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture?: (imageData: string) => void;
  onClose?: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
        
        if (onCapture) {
          onCapture(imageData);
        }
      }
    }
  }, [stopCamera, onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isStreaming) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [isStreaming, stopCamera, startCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Camera</CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {!capturedImage ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="flex gap-2 justify-center">
          {!isStreaming && !capturedImage && (
            <Button onClick={startCamera} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          )}
          
          {isStreaming && (
            <>
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Capture
              </Button>
              <Button variant="outline" onClick={switchCamera}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {capturedImage && (
            <>
              <Button onClick={retakePhoto} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button onClick={() => {
                const link = document.createElement('a');
                link.download = `repair-photo-${Date.now()}.jpg`;
                link.href = capturedImage;
                link.click();
              }}>
                <Download className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraCapture;