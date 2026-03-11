import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, DollarSign, Wrench, Volume2 } from 'lucide-react';
import CameraCapture from '../camera/CameraCapture';
import VoiceControls from '../voice/VoiceControls';
import { analyzeRepairImage, AIAnalysisResult } from '@/services/aiVisionService';

const AIPhotoAnalyzer: React.FC = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleVoiceInput = (text: string) => {
    // Voice input could trigger re-analysis or provide additional context
    console.log('Voice input received:', text);
  };

  const handleSpeakAnalysis = async (text: string) => {
    try {
      const { speechService } = await import('@/services/speechService');
      const { languageService } = await import('@/services/languageService');
      
      // Format text for speech using language service
      const formattedText = languageService.formatTextForSpeech(text);

      await speechService.speak(formattedText, {
        rate: 0.9,
        pitch: 1,
        volume: 0.8
      });
    } catch (error) {
      console.error('Error speaking analysis:', error);
      setError('Failed to speak analysis. Speech synthesis may not be supported.');
    }
  };

  const handleImageAnalysis = async (imageData: string, imageFile?: File) => {
    setAnalyzing(true);
    setError(null);
    setUploadedImage(imageData);
    
    try {
      const result = await analyzeRepairImage(imageData, imageFile);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        handleImageAnalysis(imageData, file);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={(imageData) => {
          setShowCamera(false);
          handleImageAnalysis(imageData);
        }}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Voice Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VoiceControls
            onVoiceInput={handleVoiceInput}
            onSpeakText={handleSpeakAnalysis}
            disabled={analyzing}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            AI Photo Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!uploadedImage && (
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setShowCamera(true)} className="flex-1 max-w-xs">
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
              <div className="flex-1 max-w-xs">
                <Button variant="outline" className="w-full" onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {uploadedImage && (
            <div className="space-y-4">
              <img
                src={uploadedImage}
                alt="Uploaded for analysis"
                className="w-full max-w-md mx-auto rounded-lg shadow-md"
              />
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadedImage(null);
                    setAnalysis(null);
                    setError(null);
                  }}
                >
                  Upload Different Image
                </Button>
              </div>
            </div>
          )}

          {analyzing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {analysis?.diagnosis?.includes('[Offline Analysis]') 
                  ? "Analyzing image with offline patterns... This may take a moment."
                  : "Analyzing image with AI... This may take a few moments."
                }
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Show offline indicator if analysis is from fallback */}
              {analysis.diagnosis.includes('[Offline Analysis]') && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    Analysis performed using offline pattern recognition. For more detailed insights, configure OpenAI API key.
                  </AlertDescription>
                </Alert>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Analysis Results
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(analysis.severity)}>
                        {analysis.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getDifficultyColor(analysis.difficulty)}>
                        {analysis.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fullAnalysis = `Diagnosis: ${analysis.diagnosis}. Recommendations: ${analysis.recommendations.join('. ')}. Required tools: ${analysis.tools.join(', ')}. Estimated cost: ${analysis.estimatedCost}.`;
                        handleSpeakAnalysis(fullAnalysis);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      Read Full Analysis
                    </Button>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Diagnosis</h4>
                    <p className="text-gray-700">{analysis.diagnosis}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Estimated Cost
                      </h4>
                      <p className="text-gray-700">{analysis.estimatedCost}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Required Tools
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {analysis.tools.map((tool, index) => (
                          <Badge key={index} variant="outline">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Recommendations
                    </h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-gray-700">{rec}</li>
                      ))}
                    </ol>
                  </div>

                  {analysis.safetyWarnings && analysis.safetyWarnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Safety Warnings:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {analysis.safetyWarnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPhotoAnalyzer;