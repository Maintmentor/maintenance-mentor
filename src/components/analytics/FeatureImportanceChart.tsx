import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface FeatureImportanceChartProps {
  featureImportance?: {
    sharpness: number;
    objectConfidence: number;
    edgeDensity: number;
    contrast: number;
    resolution: number;
    colorfulness: number;
    centeredness: number;
  };
}

export function FeatureImportanceChart({ featureImportance }: FeatureImportanceChartProps) {
  if (!featureImportance) {
    return null;
  }

  const features = [
    { name: 'Sharpness', value: featureImportance.sharpness, color: 'bg-blue-500' },
    { name: 'Object Confidence', value: featureImportance.objectConfidence, color: 'bg-purple-500' },
    { name: 'Edge Density', value: featureImportance.edgeDensity, color: 'bg-green-500' },
    { name: 'Contrast', value: featureImportance.contrast, color: 'bg-orange-500' },
    { name: 'Resolution', value: featureImportance.resolution, color: 'bg-pink-500' },
    { name: 'Colorfulness', value: featureImportance.colorfulness, color: 'bg-yellow-500' },
    { name: 'Centeredness', value: featureImportance.centeredness, color: 'bg-teal-500' }
  ].sort((a, b) => b.value - a.value);

  const maxValue = Math.max(...features.map(f => f.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Feature Importance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features.map((feature) => (
            <div key={feature.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{feature.name}</span>
                <span className="text-muted-foreground">
                  {(feature.value * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${feature.color} transition-all duration-500`}
                  style={{ width: `${(feature.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Higher values indicate features that have more influence on image quality predictions.
        </p>
      </CardContent>
    </Card>
  );
}
