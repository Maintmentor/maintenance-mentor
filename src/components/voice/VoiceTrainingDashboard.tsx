import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mic, Play, Square, Trophy, Target, TrendingUp, User, Volume2 } from 'lucide-react';
import { VoiceProfileManager } from './VoiceProfileManager';
import { VoiceTrainingSession } from './VoiceTrainingSession';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function VoiceTrainingDashboard() {
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageAccuracy: 0,
    wordsLearned: 0,
    trainingStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
    loadStats();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('voice_training_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
      if (data && data.length > 0) {
        setActiveProfile(data.find(p => p.is_active) || data[0]);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from('voice_training_sessions')
        .select('accuracy_scores, status')
        .eq('status', 'completed');

      if (sessions) {
        const totalAccuracy = sessions.reduce((sum, s) => {
          const scores = s.accuracy_scores as number[];
          return sum + (scores.reduce((a, b) => a + b, 0) / scores.length);
        }, 0);

        setStats({
          totalSessions: sessions.length,
          averageAccuracy: sessions.length > 0 ? totalAccuracy / sessions.length : 0,
          wordsLearned: sessions.length * 10,
          trainingStreak: Math.min(sessions.length, 7)
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Voice Training Center</h1>
          <p className="text-muted-foreground">Train the AI to better understand your voice</p>
        </div>
        <div className="flex items-center gap-2">
          {activeProfile && (
            <Badge variant="secondary" className="px-3 py-1">
              <User className="w-4 h-4 mr-1" />
              {activeProfile.profile_name}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions Completed</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Accuracy</p>
                <p className="text-2xl font-bold">{stats.averageAccuracy.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Words Learned</p>
                <p className="text-2xl font-bold">{stats.wordsLearned}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Training Streak</p>
                <p className="text-2xl font-bold">{stats.trainingStreak} days</p>
              </div>
              <Volume2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="training" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="training">Training Session</TabsTrigger>
          <TabsTrigger value="profiles">Voice Profiles</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="training">
          <VoiceTrainingSession 
            profile={activeProfile}
            onSessionComplete={() => {
              loadStats();
              toast({
                title: "Training Complete!",
                description: "Your voice model has been updated."
              });
            }}
          />
        </TabsContent>

        <TabsContent value="profiles">
          <VoiceProfileManager
            profiles={profiles}
            activeProfile={activeProfile}
            onProfileChange={(profile) => {
              setActiveProfile(profile);
              loadProfiles();
            }}
          />
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Training Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Overall Progress</span>
                  <span className="text-sm font-medium">{Math.min(stats.totalSessions * 10, 100)}%</span>
                </div>
                <Progress value={Math.min(stats.totalSessions * 10, 100)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Achievements</h4>
                  <div className="space-y-1">
                    {stats.totalSessions >= 1 && <Badge>First Session</Badge>}
                    {stats.totalSessions >= 5 && <Badge>5 Sessions</Badge>}
                    {stats.averageAccuracy >= 80 && <Badge>80% Accuracy</Badge>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Next Goals</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Complete 10 training sessions</li>
                    <li>• Achieve 90% average accuracy</li>
                    <li>• Train on advanced terminology</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}