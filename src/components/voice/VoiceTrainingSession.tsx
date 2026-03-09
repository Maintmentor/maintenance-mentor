import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Play, RotateCcw, ChevronRight, Volume2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface VoiceTrainingSessionProps {
  profile: any;
  onSessionComplete: () => void;
}

export function VoiceTrainingSession({ profile, onSessionComplete }: VoiceTrainingSessionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<any>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [accuracyScores, setAccuracyScores] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);
  const [sessionType, setSessionType] = useState<'basic' | 'repair_terms' | 'custom'>('basic');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      loadPrompts();
      initSession();
    }
  }, [profile, sessionType]);

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_training_prompts')
        .select('*')
        .eq('category', sessionType)
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true })
        .limit(10);

      if (error) throw error;
      setPrompts(data || []);
      if (data && data.length > 0) {
        setCurrentPrompt(data[0]);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const initSession = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('voice_training_sessions')
        .insert({
          profile_id: profile.id,
          session_type: sessionType,
          total_prompts: 10,
          prompts_completed: 0
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        await processRecording(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to continue.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processRecording = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64 for processing
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result;

        // Call edge function to analyze speech
        const { data, error } = await supabase.functions.invoke('voice-training-processor', {
          body: {
            action: 'analyze_speech',
            data: {
              audioData: base64Audio,
              promptText: currentPrompt.prompt_text
            }
          }
        });

        if (error) throw error;

        setLastResult(data);
        setAccuracyScores([...accuracyScores, data.accuracy]);

        // Save recording to database
        if (sessionId) {
          await supabase.from('voice_recordings').insert({
            session_id: sessionId,
            prompt_id: currentPrompt.id,
            transcription: data.transcription,
            confidence_score: data.confidence,
            analysis_data: data.characteristics
          });
        }

        // Update session progress
        if (sessionId) {
          await supabase
            .from('voice_training_sessions')
            .update({
              prompts_completed: promptIndex + 1,
              accuracy_scores: [...accuracyScores, data.accuracy]
            })
            .eq('id', sessionId);
        }
      };
    } catch (error) {
      console.error('Error processing recording:', error);
      toast({
        title: "Processing Error",
        description: "Failed to analyze your speech. Please try again.",
        variant: "destructive"
      });
    }
  };

  const nextPrompt = () => {
    if (promptIndex < prompts.length - 1) {
      setPromptIndex(promptIndex + 1);
      setCurrentPrompt(prompts[promptIndex + 1]);
      setLastResult(null);
    } else {
      completeSession();
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;

    try {
      await supabase
        .from('voice_training_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Get feedback
      const { data: feedback } = await supabase.functions.invoke('voice-training-processor', {
        body: {
          action: 'generate_feedback',
          data: {
            sessionData: { sessionId },
            accuracyScores
          }
        }
      });

      toast({
        title: "Session Complete!",
        description: `Average accuracy: ${(accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length).toFixed(1)}%`
      });

      onSessionComplete();
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const playPromptAudio = () => {
    const utterance = new SpeechSynthesisUtterance(currentPrompt.prompt_text);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  if (!profile) {
    return (
      <Alert>
        <AlertDescription>
          Please create a voice profile to start training.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Type Selector */}
      <div className="flex gap-2">
        <Button
          variant={sessionType === 'basic' ? 'default' : 'outline'}
          onClick={() => setSessionType('basic')}
        >
          Basic Training
        </Button>
        <Button
          variant={sessionType === 'repair_terms' ? 'default' : 'outline'}
          onClick={() => setSessionType('repair_terms')}
        >
          Repair Terminology
        </Button>
        <Button
          variant={sessionType === 'custom' ? 'default' : 'outline'}
          onClick={() => setSessionType('custom')}
        >
          Custom Phrases
        </Button>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm">Progress</span>
          <span className="text-sm">{promptIndex + 1} / {prompts.length}</span>
        </div>
        <Progress value={(promptIndex + 1) / prompts.length * 100} />
      </div>

      {/* Current Prompt */}
      {currentPrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Prompt</span>
              <Badge>Difficulty: {currentPrompt.difficulty_level}/3</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-medium text-center p-6 bg-muted rounded-lg">
              {currentPrompt.prompt_text}
            </div>

            {currentPrompt.phonetic_guide && (
              <div className="text-center text-muted-foreground italic">
                {currentPrompt.phonetic_guide}
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={playPromptAudio}
              >
                <Volume2 className="w-4 h-4" />
              </Button>

              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                className="px-8"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>

              {lastResult && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setLastResult(null);
                    startRecording();
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Accuracy Score:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{lastResult.accuracy.toFixed(1)}%</span>
                {lastResult.accuracy >= 80 ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <X className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence:</span>
                <span>{lastResult.confidence.toFixed(1)}%</span>
              </div>
              <Progress value={lastResult.confidence} />
            </div>

            <div className="pt-4">
              <Button onClick={nextPrompt} className="w-full">
                {promptIndex < prompts.length - 1 ? 'Next Prompt' : 'Complete Session'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}