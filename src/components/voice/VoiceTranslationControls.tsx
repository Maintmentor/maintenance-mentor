import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Square, Languages } from 'lucide-react';
import { voiceTranslationService, VoiceTranslationEntry, VoiceTranslationSession } from '@/services/voiceTranslationService';
import { languageService } from '@/services/languageService';

interface VoiceTranslationControlsProps {
  onTranslation?: (entry: VoiceTranslationEntry) => void;
  onError?: (error: string) => void;
}

export const VoiceTranslationControls: React.FC<VoiceTranslationControlsProps> = ({
  onTranslation,
  onError
}) => {
  const [session, setSession] = useState<VoiceTranslationSession | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputLanguage, setInputLanguage] = useState('en');
  const [outputLanguage, setOutputLanguage] = useState('es');
  const [conversationHistory, setConversationHistory] = useState<VoiceTranslationEntry[]>([]);

  const languages = languageService.getSupportedLanguages();

  useEffect(() => {
    const currentSession = voiceTranslationService.getSession();
    setSession(currentSession);
    
    if (currentSession) {
      setConversationHistory(currentSession.conversationHistory);
    }
  }, []);

  const startSession = () => {
    const success = voiceTranslationService.startSession(inputLanguage, outputLanguage);
    if (success) {
      setSession(voiceTranslationService.getSession());
      setConversationHistory([]);
    } else {
      onError?.('Failed to start voice translation session');
    }
  };

  const startListening = async () => {
    if (!session) {
      startSession();
      return;
    }

    setIsListening(true);
    const success = await voiceTranslationService.startListening(
      (entry) => {
        setConversationHistory(prev => [...prev, entry]);
        onTranslation?.(entry);
        setIsListening(false);
      },
      (error) => {
        onError?.(error);
        setIsListening(false);
      }
    );

    if (!success) {
      setIsListening(false);
      onError?.('Failed to start listening');
    }
  };

  const stopListening = () => {
    voiceTranslationService.stopListening();
    setIsListening(false);
  };

  const stopSession = () => {
    voiceTranslationService.stopSession();
    setSession(null);
    setIsListening(false);
    setIsSpeaking(false);
  };

  const switchLanguages = () => {
    const temp = inputLanguage;
    setInputLanguage(outputLanguage);
    setOutputLanguage(temp);
    
    if (session) {
      voiceTranslationService.stopSession();
      voiceTranslationService.startSession(outputLanguage, temp);
      setSession(voiceTranslationService.getSession());
    }
  };

  const clearHistory = () => {
    voiceTranslationService.clearHistory();
    setConversationHistory([]);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Voice Translation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Input Language</label>
              <Select value={inputLanguage} onValueChange={setInputLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={switchLanguages}
                className="h-10 w-10 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Output Language</label>
              <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {!session ? (
              <Button onClick={startSession} className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Start Translation Session
              </Button>
            ) : (
              <>
                <Button
                  onClick={isListening ? stopListening : startListening}
                  variant={isListening ? "destructive" : "default"}
                  className="flex items-center gap-2"
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Start Listening
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={stopSession}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  End Session
                </Button>
                
                <Button
                  onClick={clearHistory}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Clear History
                </Button>
              </>
            )}
          </div>
          
          {session && (
            <div className="mt-4 text-center">
              <Badge variant="outline" className="mr-2">
                {languages.find(l => l.code === session.inputLanguage)?.flag} 
                {languages.find(l => l.code === session.inputLanguage)?.name}
              </Badge>
              →
              <Badge variant="outline" className="ml-2">
                {languages.find(l => l.code === session.outputLanguage)?.flag}
                {languages.find(l => l.code === session.outputLanguage)?.name}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Translation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {conversationHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg border ${
                    entry.isUserInput ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {languages.find(l => l.code === entry.sourceLanguage)?.flag}
                        {entry.sourceLanguage.toUpperCase()}
                      </Badge>
                      →
                      <Badge variant="outline" className="text-xs">
                        {languages.find(l => l.code === entry.targetLanguage)?.flag}
                        {entry.targetLanguage.toUpperCase()}
                      </Badge>
                      <Badge className={`text-xs ${getConfidenceColor(entry.confidence)}`}>
                        {Math.round(entry.confidence * 100)}%
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">{entry.originalText}</p>
                    <p className="text-sm font-medium">{entry.translatedText}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Commands Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Voice Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1 text-gray-600">
            <p>• "Switch languages" - Swap input/output languages</p>
            <p>• "Stop translation" - End the current session</p>
            <p>• "Repeat last" - Repeat the last translation</p>
            <p>• Commands work in multiple languages</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};