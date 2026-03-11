import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, DollarSign, Wrench, Clock } from 'lucide-react';
import { AIAnalysisResult } from '@/services/aiVisionService';

interface AIAnalysisCardProps {
  analysis: AIAnalysisResult;
  timestamp?: string;
}

const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ analysis, timestamp }) => {
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            AI Analysis Results
          </span>
          <div className="flex gap-2">
            <Badge className={getSeverityColor(analysis.severity)}>
              {analysis.severity.toUpperCase()}
            </Badge>
            <Badge className={getDifficultyColor(analysis.difficulty)}>
              {analysis.difficulty.toUpperCase()}
            </Badge>
          </div>
        </CardTitle>
        {timestamp && (
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {timestamp}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
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
  );
};

export default AIAnalysisCard;