import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Loader2, 
  AlertCircle,
  Settings,
  Globe
} from 'lucide-react';
import { speechService } from '@/services/speechService';
import { languageService } from '@/services/languageService';
import { VoiceSettings } from './VoiceSettings';

interface VoiceControlsProps {
  onVoiceInput: (text: string) => void;
  onSpeakText: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceControls({ 
  onVoiceInput, 
  onSpeakText, 
  disabled = false,
  className = '' 
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState(languageService.getCurrentLanguage());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setIsSupported(speechService.isSupported());
    
    // Check for speech synthesis voices loading
    const checkVoices = () => {
      if (speechService.getAvailableVoices().length > 0) {
        setIsSupported(true);
      }
    };
    
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
      checkVoices();
    }

    // Update current language when it changes
    const updateLanguage = () => {
      setCurrentLanguage(languageService.getCurrentLanguage());
    };
    
    // Listen for language changes (simplified - in a real app you'd use context)
    const interval = setInterval(updateLanguage, 1000);

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      clearInterval(interval);
    };
  }, []);

  const startListening = () => {
    if (!isSupported || disabled) return;

    setError(null);
    setTranscript('');
    
    const success = speechService.startListening(
      (text: string) => {
        setTranscript(text);
        setIsListening(false);
        onVoiceInput(text);
      },
      (error: string) => {
        setError(`Speech recognition error: ${error}`);
        setIsListening(false);
      }
    );

    if (success) {
      setIsListening(true);
    } else {
      setError('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  const handleSpeakLastMessage = async (text: string) => {
    if (!isSupported || disabled || !text.trim()) return;

    setError(null);
    setIsSpeaking(true);

    try {
      await speechService.speak(text, {
        rate: 0.9,
        pitch: 1,
        volume: 0.8
      });
      
      onSpeakText(text);
    } catch (err) {
      setError('Failed to speak text');
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
  };

  const getLocalizedText = (key: string): string => {
    const texts: Record<string, Record<string, string>> = {
      'voice': {
        'en': 'Voice',
        'es': 'Voz',
        'fr': 'Voix',
        'de': 'Stimme',
        'it': 'Voce',
        'pt': 'Voz',
        'zh': '语音',
        'ja': '音声',
        'ko': '음성',
        'ar': 'صوت',
        'hi': 'आवाज़',
        'ru': 'Голос'
      },
      'speak': {
        'en': 'Speak',
        'es': 'Hablar',
        'fr': 'Parler',
        'de': 'Sprechen',
        'it': 'Parla',
        'pt': 'Falar',
        'zh': '朗读',
        'ja': '話す',
        'ko': '말하기',
        'ar': 'تحدث',
        'hi': 'बोलें',
        'ru': 'Говорить'
      },
      'listening': {
        'en': 'Listening...',
        'es': 'Escuchando...',
        'fr': 'Écoute...',
        'de': 'Höre zu...',
        'it': 'Ascolto...',
        'pt': 'Ouvindo...',
        'zh': '正在听...',
        'ja': '聞いています...',
        'ko': '듣는 중...',
        'ar': 'استمع...',
        'hi': 'सुन रहा है...',
        'ru': 'Слушаю...'
      },
      'speaking': {
        'en': 'Speaking...',
        'es': 'Hablando...',
        'fr': 'Parle...',
        'de': 'Spreche...',
        'it': 'Parlando...',
        'pt': 'Falando...',
        'zh': '正在朗读...',
        'ja': '話しています...',
        'ko': '말하는 중...',
        'ar': 'يتحدث...',
        'hi': 'बोल रहा है...',
        'ru': 'Говорю...'
      }
    };
    
    return texts[key]?.[currentLanguage.code] || texts[key]?.['en'] || key;
  };

  if (!isSupported) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Voice features are not supported in your browser. Please use Chrome, Edge, or Safari for voice functionality.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Voice Input Button */}
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || isSpeaking}
          className="flex items-center gap-2"
        >
          {isListening ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <MicOff className="w-4 h-4" />
              Stop
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              {getLocalizedText('voice')}
            </>
          )}
        </Button>

        {/* Speak Button */}
        <Button
          variant={isSpeaking ? "destructive" : "outline"}
          size="sm"
          onClick={isSpeaking ? stopSpeaking : () => handleSpeakLastMessage("Click the speak button next to any repair instruction to hear it read aloud.")}
          disabled={disabled || isListening}
          className="flex items-center gap-2"
        >
          {isSpeaking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <VolumeX className="w-4 h-4" />
              Stop
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              {getLocalizedText('speak')}
            </>
          )}
        </Button>

        {/* Language Indicator */}
        <Badge variant="outline" className="flex items-center gap-1">
          <Globe className="w-3 h-3" />
          {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
        </Badge>

        {/* Voice Settings */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <VoiceSettings onClose={() => setShowSettings(false)} />
          </DialogContent>
        </Dialog>

        {/* Status Indicators */}
        {isListening && (
          <Badge variant="secondary" className="animate-pulse">
            <Mic className="w-3 h-3 mr-1" />
            {getLocalizedText('listening')}
          </Badge>
        )}

        {isSpeaking && (
          <Badge variant="secondary" className="animate-pulse">
            <Volume2 className="w-3 h-3 mr-1" />
            {getLocalizedText('speaking')}
          </Badge>
        )}
      </div>

      {/* Live Transcript */}
      {transcript && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Voice Input:</strong> {transcript}
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>• Click "{getLocalizedText('voice')}" to describe your repair issue verbally</div>
        <div>• Click "{getLocalizedText('speak')}" next to any message to hear it read aloud</div>
        <div>• Perfect for hands-free operation during repairs</div>
        <div>• Language: {currentLanguage.nativeName} ({currentLanguage.name})</div>
      </div>
    </div>
  );
}