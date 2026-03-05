import React, { useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, X, RotateCcw, Check, Edit } from 'lucide-react';
import { toast } from 'sonner';
import ImageAnnotationEditor from './ImageAnnotationEditor';

interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  onImagesSelected: (images: File[]) => void;
}

export default function ImageUploadModal({ open, onClose, onImagesSelected }: ImageUploadModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      toast.error('Unable to access camera. Please check permissions.');
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
        setCapturedImages(prev => [...prev, imageData]);
        toast.success('Photo captured! Click to annotate.');
      }
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const dataUrls = await Promise.all(
        files.map(file => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        }))
      );
      setCapturedImages(prev => [...prev, ...dataUrls]);
      toast.success('Images loaded! Click to annotate.');
    }
  };

  const handleAnnotationSave = (annotatedUrl: string) => {
    if (editingIndex !== null) {
      setCapturedImages(prev => {
        const newImages = [...prev];
        newImages[editingIndex] = annotatedUrl;
        return newImages;
      });
      setEditingIndex(null);
      toast.success('Annotation saved!');
    }
  };

  const handleDone = async () => {
    if (capturedImages.length === 0) return;
    const files = await Promise.all(
      capturedImages.map(async (dataUrl, i) => {
        const blob = await (await fetch(dataUrl)).blob();
        return new File([blob], `annotated-${Date.now()}-${i}.jpg`, { type: 'image/jpeg' });
      })
    );
    onImagesSelected(files);
    setCapturedImages([]);
    stopCamera();
    onClose();
  };

  React.useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  if (editingIndex !== null) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Annotate Image - Mark Problem Areas</DialogTitle>
          </DialogHeader>
          <ImageAnnotationEditor
            imageUrl={capturedImages[editingIndex]}
            onSave={handleAnnotationSave}
            onCancel={() => setEditingIndex(null)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Photos</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="camera">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera">Camera</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="camera" className="space-y-4">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            {capturedImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {capturedImages.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0 group">
                    <img src={img} alt="" className="w-24 h-24 object-cover rounded border-2 border-gray-300" />
                    <button onClick={() => setEditingIndex(i)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Edit className="w-6 h-6 text-white" />
                    </button>
                    <button onClick={() => setCapturedImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              {!isStreaming ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="mr-2 h-4 w-4" />Start Camera
                </Button>
              ) : (
                <>
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera className="mr-2 h-4 w-4" />Capture
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
                    stopCamera();
                    setTimeout(startCamera, 100);
                  }}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}
              {capturedImages.length > 0 && (
                <Button onClick={handleDone} className="bg-green-600 hover:bg-green-700">
                  <Check className="mr-2 h-4 w-4" />Send ({capturedImages.length})
                </Button>
              )}
            </div>
          </TabsContent>
          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-4">Click to select images or drag and drop</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()}>
                Select Files
              </Button>
            </div>
            {capturedImages.length > 0 && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {capturedImages.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0 group">
                      <img src={img} alt="" className="w-24 h-24 object-cover rounded border-2 border-gray-300" />
                      <button onClick={() => setEditingIndex(i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Edit className="w-6 h-6 text-white" />
                      </button>
                      <button onClick={() => setCapturedImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button onClick={handleDone} className="w-full bg-green-600 hover:bg-green-700">
                  <Check className="mr-2 h-4 w-4" />Send All Images ({capturedImages.length})
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
