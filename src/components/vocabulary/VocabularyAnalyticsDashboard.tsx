import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { vocabularyAnalyticsService, VocabularyAnalytics } from '@/services/vocabularyAnalyticsService';
import ProgressChart from './ProgressChart';
import { 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Target,
  Brain,
  Award,
  BarChart3,
  Lightbulb
} from 'lucide-react';

export default function VocabularyAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<VocabularyAnalytics | null>(null);
  const [dateRange, setDateRange] = useState('30days');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await vocabularyAnalyticsService.getAnalytics(dateRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading vocabulary analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const masteryPercentage = analytics.totalTerms > 0 
    ? Math.round((analytics.masteredTerms / analytics.totalTerms) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vocabulary Analytics</h2>
          <p className="text-gray-600">Track your learning progress and performance</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Terms</p>
                <p className="text-2xl font-bold">{analytics.totalTerms}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={masteryPercentage} className="h-2" />
              <p className="text-sm text-gray-600 mt-1">{masteryPercentage}% mastered</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold">{analytics.retentionRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {analytics.retentionRate >= 80 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <Target className="h-4 w-4 text-orange-500 mr-1" />
              )}
              <span className={`text-sm ${analytics.retentionRate >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                {analytics.retentionRate >= 80 ? 'Excellent!' : 'Keep practicing'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{(analytics.averageResponseTime / 1000).toFixed(1)}s</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-600">
                {analytics.averageResponseTime < 3000 ? 'Fast recall!' : 'Room for improvement'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mastered Terms</p>
                <p className="text-2xl font-bold">{analytics.masteredTerms}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-green-600">
                +{analytics.newTerms} new this period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart
          data={analytics.learningVelocity}
          title="Daily Learning Activity"
          type="line"
          dataKey="masteredTerms"
          xAxisKey="date"
          color="#10b981"
        />
        
        <ProgressChart
          data={analytics.weeklyProgress}
          title="Weekly Progress"
          type="bar"
          dataKey="accuracy"
          xAxisKey="week"
          color="#8b5cf6"
        />
      </div>

      {/* Difficulty Progression & Category Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Difficulty Progression
            </CardTitle>
            <CardDescription>Your mastery across difficulty levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.difficultyProgression.map((level) => (
                <div key={level.level} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{level.level}</span>
                    <span className="text-sm text-gray-600">
                      {level.mastered}/{level.total} ({level.percentage}%)
                    </span>
                  </div>
                  <Progress value={level.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Category Mastery
            </CardTitle>
            <CardDescription>Performance by equipment category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.categoryMastery.slice(0, 5).map((category) => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{category.category}</p>
                    <p className="text-sm text-gray-600">
                      {category.mastered}/{category.total} terms • Avg: {(category.averageTime / 1000).toFixed(1)}s
                    </p>
                  </div>
                  <Badge variant={category.percentage >= 80 ? 'default' : 'secondary'}>
                    {category.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Personalized Recommendations
          </CardTitle>
          <CardDescription>AI-powered suggestions to improve your learning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-1 bg-blue-100 rounded-full mt-1">
                  <Lightbulb className="h-3 w-3 text-blue-600" />
                </div>
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}