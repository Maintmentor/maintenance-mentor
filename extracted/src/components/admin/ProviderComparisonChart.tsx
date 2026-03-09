import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { translationProviderService } from '@/services/translationProviderService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
];

export default function ProviderComparisonChart() {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComparison();
  }, [sourceLang, targetLang]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const data = await translationProviderService.getProviderComparison(sourceLang, targetLang);
      
      const chartData = data.map(item => ({
        name: item.translation_providers.name,
        'Success Rate': item.total_requests > 0 
          ? (item.successful_requests / item.total_requests) * 100 
          : 0,
        'Avg Response Time (ms)': item.avg_response_time_ms,
        'Cost per 1K': item.translation_providers.cost_per_1k_chars * 100,
        'Quality Score': item.translation_providers.quality_score * 100,
        'Total Requests': item.total_requests
      }));

      setComparisonData(chartData);
    } catch (error) {
      console.error('Error loading comparison:', error);
      toast.error('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Performance Comparison</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">Loading...</div>
        ) : comparisonData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No data available for this language pair
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Success Rate" fill="#10b981" />
              <Bar dataKey="Quality Score" fill="#3b82f6" />
              <Bar dataKey="Avg Response Time (ms)" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
