import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Brain, Eye, Palette, Focus } from 'lucide-react';
import { FeatureImportanceChart } from './FeatureImportanceChart';


export function AdvancedMLDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: feedback } = await supabase
        .from('image_quality_feedback')
        .select('*')
        .not('edge_density', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!feedback) return;

      const avgMetrics = {
        edgeDensity: feedback.reduce((sum, f) => sum + (f.edge_density || 0), 0) / feedback.length,
        sharpness: feedback.reduce((sum, f) => sum + (f.sharpness || 0), 0) / feedback.length,
        colorfulness: feedback.reduce((sum, f) => sum + (f.colorfulness || 0), 0) / feedback.length,
        contrast: feedback.reduce((sum, f) => sum + (f.contrast || 0), 0) / feedback.length,
        objectConfidence: feedback.reduce((sum, f) => sum + (f.object_confidence || 0), 0) / feedback.length,
        centeredness: feedback.reduce((sum, f) => sum + (f.centeredness || 0), 0) / feedback.length,
        compositeScore: feedback.reduce((sum, f) => sum + (f.composite_score || 0), 0) / feedback.length
      };

      const { data: model } = await supabase
        .from('ml_model_configs')
        .select('*')
        .eq('model_name', 'advanced_image_quality')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setMetrics({ avgMetrics, model, totalSamples: feedback.length });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading advanced metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Edge Detection</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics?.avgMetrics?.edgeDensity || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Avg Edge Density</p>
            <div className="mt-2">
              <div className="text-sm">Sharpness: {((metrics?.avgMetrics?.sharpness || 0) * 100).toFixed(1)}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Color Analysis</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics?.avgMetrics?.colorfulness || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Colorfulness</p>
            <div className="mt-2">
              <div className="text-sm">Contrast: {((metrics?.avgMetrics?.contrast || 0) * 100).toFixed(1)}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Object Detection</CardTitle>
            <Focus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics?.avgMetrics?.objectConfidence || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Confidence</p>
            <div className="mt-2">
              <div className="text-sm">Centered: {((metrics?.avgMetrics?.centeredness || 0) * 100).toFixed(1)}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Composite Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics?.avgMetrics?.compositeScore || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall Quality</p>
            <div className="mt-2">
              <div className="text-sm">{metrics?.totalSamples || 0} samples</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics?.model && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Current Model Weights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Sharpness</div>
                    <div className="text-lg font-semibold">
                      {((metrics.model.sharpness_weight || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Object Confidence</div>
                    <div className="text-lg font-semibold">
                      {((metrics.model.object_confidence_weight || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Edge Density</div>
                    <div className="text-lg font-semibold">
                      {((metrics.model.edge_density_weight || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contrast</div>
                    <div className="text-lg font-semibold">
                      {((metrics.model.contrast_weight || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Model Accuracy:</span>
                    <span className="font-semibold">{((metrics.model.accuracy || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Training Samples:</span>
                    <span className="font-semibold">{metrics.model.training_samples || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <FeatureImportanceChart featureImportance={metrics.model.feature_importance} />
          </>
        )}
      </div>
    </div>
  );
}
