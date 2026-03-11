import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Check, X, Globe } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_LANGUAGES, detectBrowserLanguage, getLanguageByCode } from '@/services/languageService';
import { translationService } from '@/services/translationService';
import { TranslationIndicator } from '@/components/translation/TranslationIndicator';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceInputProps {
  onTranscript: (text: string, originalText?: string, sourceLang?: string) => void;
  disabled?: boolean;
  conversationId?: string;
}



export default function VoiceInput({ onTranscript, disabled, conversationId }: VoiceInputProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => detectBrowserLanguage());
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<any>(null);
  const recognitionRef = useRef<any>(null);


  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;


    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPart + ' ';
        } else {
          interim += transcriptPart;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        toast.error('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable it in your browser settings.');
      } else {
        toast.error(`Speech recognition error: ${event.error}`);
      }
      stopRecording();
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording, selectedLanguage]);

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    const lang = getLanguageByCode(langCode);
    toast.success(`Language changed to ${lang?.name || langCode}`);
    
    // If recording, restart with new language
    if (isRecording) {
      recognitionRef.current?.stop();
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.lang = langCode;
          recognitionRef.current.start();
        }
      }, 100);
    }
  };


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setTranscript('');
      setInterimTranscript('');
      setIsRecording(true);
      recognitionRef.current?.start();
      toast.success('Recording started. Speak now...');
    } catch (error) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognitionRef.current?.stop();
  };

  const handleAccept = async () => {
    const fullText = transcript + interimTranscript;
    if (!fullText.trim()) return;

    stopRecording();

    // Check if translation is needed
    if (user && selectedLanguage !== 'en-US' && selectedLanguage !== 'en-GB') {
      try {
        setIsTranslating(true);
        const prefs = await translationService.getPreferences(user.id);
        
        if (prefs.autoTranslateEnabled) {
          const result = await translationService.translate(
            fullText.trim(),
            selectedLanguage,
            'en-US'
          );
          
          setTranslationResult(result);
          
          // Save to history if conversation exists
          if (conversationId) {
            await translationService.saveToHistory(
              user.id,
              conversationId,
              fullText.trim(),
              result.translatedText,
              selectedLanguage,
              'en-US',
              'user_to_ai'
            );
          }
          
          // Pass both translated and original text
          onTranscript(result.translatedText, fullText.trim(), selectedLanguage);
          
          // Show translation with feedback options
          if (result.translationId) {
            toast.success(
              <div className="space-y-2">
                <p>{result.cached ? 'Transcript translated (cached)' : 'Transcript translated'}</p>
                <TranslationIndicator
                  sourceLang={selectedLanguage}
                  targetLang="en-US"
                  cached={result.cached}
                  confidence={result.confidence}
                  translationId={result.translationId}
                  originalText={fullText.trim()}
                  translatedText={result.translatedText}
                />
              </div>
            );
          } else {
            toast.success(result.cached ? 'Transcript translated (cached)' : 'Transcript translated');
          }
        } else {
          onTranscript(fullText.trim());
          toast.success('Transcript added to message');
        }
      } catch (error) {
        console.error('Translation error:', error);
        toast.error('Translation failed, using original text');
        onTranscript(fullText.trim());
      } finally {
        setIsTranslating(false);
        setTranscript('');
        setInterimTranscript('');
        setTranslationResult(null);
      }
    } else {
      onTranscript(fullText.trim());
      setTranscript('');
      setInterimTranscript('');
      toast.success('Transcript added to message');
    }
  };




  const handleCancel = () => {
    setTranscript('');
    setInterimTranscript('');
    stopRecording();
  };

  const fullTranscript = transcript + interimTranscript;
  const currentLang = getLanguageByCode(selectedLanguage);

  return (
    <div className="relative flex gap-2">
      {/* Language Selector Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowLanguageSelector(!showLanguageSelector)}
        disabled={disabled}
        className="h-12 w-12"
        title="Select language"
      >
        <Globe className="w-5 h-5" />
      </Button>

      {/* Microphone Button */}
      <Button
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`h-12 w-12 ${isRecording ? 'animate-pulse' : ''}`}
        title={isRecording ? "Stop recording" : "Start voice input"}
      >
        {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </Button>

      {/* Language Selector Dropdown */}
      {showLanguageSelector && (
        <Card className="absolute bottom-16 right-0 w-80 p-4 shadow-lg border-2 animate-in slide-in-from-bottom-2 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Select Language</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLanguageSelector(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {currentLang && `${currentLang.flag} ${currentLang.name}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                      <span className="text-xs text-gray-500">({lang.nativeName})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {/* Recording Card */}
      {(isRecording || fullTranscript || isTranslating) && (
        <Card className="absolute bottom-16 right-0 w-80 p-4 shadow-lg border-2 border-blue-500 animate-in slide-in-from-bottom-2 z-40">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">
                  {isTranslating ? 'Translating...' : isRecording ? 'Recording...' : 'Recording stopped'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {currentLang?.flag} {currentLang?.name}
              </span>
            </div>

            {isTranslating && (
              <TranslationIndicator 
                isTranslating={true}
                sourceLang={selectedLanguage}
                targetLang="en-US"
              />
            )}

            <div className="bg-gray-50 rounded-lg p-3 min-h-[80px] max-h-[200px] overflow-y-auto">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {fullTranscript || 'Speak now...'}
              </p>
            </div>


            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={!fullTranscript.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Use Text
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

