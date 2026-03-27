import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VoiceTrainingSession } from './VoiceTrainingSession';
import { VoiceProfileManager } from './VoiceProfileManager';
import { Settings, Mic, Users, BookOpen, BarChart3 } from 'lucide-react';

export function VoiceSettings() {
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Voice Settings & Training
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Profiles
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Vocabulary
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-4">
            <VoiceProfileManager />
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <Dialog open={isTrainingOpen} onOpenChange={setIsTrainingOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Mic className="w-4 h-4 mr-2" />
                  Start Training Session
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Voice Training Session</DialogTitle>
                </DialogHeader>
                <VoiceTrainingSession
                  profileId="current"
                  sessionType="accent"
                  onComplete={() => setIsTrainingOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="vocabulary" className="space-y-4">
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Shared Vocabulary</h3>
              <p className="text-gray-600 mb-4">
                Access technical terms and pronunciations shared across your team
              </p>
              <Button variant="outline">Browse Vocabulary</Button>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Training Analytics</h3>
              <p className="text-gray-600 mb-4">
                View your progress and improvement metrics
              </p>
              <Button variant="outline">View Analytics</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}