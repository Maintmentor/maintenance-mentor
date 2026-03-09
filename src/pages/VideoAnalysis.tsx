import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoUploadAnalyzer } from '@/components/video-analysis/VideoUploadAnalyzer';
import { ObjectTimeline } from '@/components/video-analysis/ObjectTimeline';
import { ObjectTrackTimeline } from '@/components/video-analysis/ObjectTrackTimeline';
import { TrackInsightsPanel } from '@/components/video-analysis/TrackInsightsPanel';
import { PredictiveTrackingPanel } from '@/components/video-analysis/PredictiveTrackingPanel';
import { ModelSelectionPanel } from '@/components/video-analysis/ModelSelectionPanel';


import { KeyFrameGallery } from '@/components/video-analysis/KeyFrameGallery';
import { VideoAnnotationTool } from '@/components/video-analysis/VideoAnnotationTool';
import { RepairGuideGenerator } from '@/components/video-analysis/RepairGuideGenerator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, CheckCircle } from 'lucide-react';


export default function VideoAnalysis() {
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [predictionMethod, setPredictionMethod] = useState<'kalman' | 'lstm'>('kalman');


  const handleAnalysisComplete = (id: string) => {
    setAnalysisId(id);
    // In real implementation, fetch video data
    setVideoData({
      duration_seconds: 120,
      status: 'completed'
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Video Analysis</h1>
        <p className="text-muted-foreground">
          Upload repair videos for AI-powered object detection and guide generation
        </p>
      </div>

      {!analysisId ? (
        <div className="max-w-2xl mx-auto">
          <VideoUploadAnalyzer onAnalysisComplete={handleAnalysisComplete} />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">Analysis Results</h2>
                  <p className="text-sm text-muted-foreground">
                    Video ID: {analysisId.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {videoData?.duration_seconds}s
                </Badge>
                <Badge className="gap-1 bg-green-500">
                  <CheckCircle className="h-3 w-3" />
                  {videoData?.status}
                </Badge>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="tracks" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="tracks">Object Tracks</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="keyframes">Key Frames</TabsTrigger>
              <TabsTrigger value="annotations">Annotations</TabsTrigger>
              <TabsTrigger value="guide">Repair Guide</TabsTrigger>
            </TabsList>


            <TabsContent value="tracks" className="mt-6 space-y-6">
              <ObjectTrackTimeline
                analysisId={analysisId}
                duration={videoData?.duration_seconds || 0}
              />
              <TrackInsightsPanel analysisId={analysisId} />
            </TabsContent>

            <TabsContent value="predictions" className="mt-6 space-y-6">
              <ModelSelectionPanel 
                videoId={analysisId}
                onMethodChange={setPredictionMethod}
              />
              <PredictiveTrackingPanel 
                trackId="track_1" 
                analysisId={analysisId} 
              />
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <ObjectTimeline
                analysisId={analysisId}
                duration={videoData?.duration_seconds || 0}
              />
            </TabsContent>

            <TabsContent value="keyframes" className="mt-6">
              <KeyFrameGallery analysisId={analysisId} />
            </TabsContent>

            <TabsContent value="annotations" className="mt-6">
              <VideoAnnotationTool
                analysisId={analysisId}
                currentTime={currentTime}
              />
            </TabsContent>

            <TabsContent value="guide" className="mt-6">
              <RepairGuideGenerator analysisId={analysisId} />
            </TabsContent>
          </Tabs>

        </div>
      )}
    </div>
  );
}
