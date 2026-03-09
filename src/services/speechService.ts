// Enhanced speech recognition and synthesis service with multi-language support
import { languageService } from './languageService';

export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      
      // Set language based on current language service setting
      this.updateRecognitionLanguage();

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.onResultCallback?.(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        let errorMessage = event.error;
        
        // Provide localized error messages
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please enable microphone permissions.';
            break;
          case 'network':
            errorMessage = 'Network error. Speech recognition may not work offline.';
            break;
        }
        
        this.onErrorCallback?.(errorMessage);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  private initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  private updateRecognitionLanguage() {
    if (this.recognition) {
      const currentLang = languageService.getCurrentLanguage();
      this.recognition.lang = currentLang.speechCode;
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null && this.synthesis !== null;
  }

  public startListening(
    onResult: (text: string) => void,
    onError: (error: string) => void
  ): boolean {
    if (!this.recognition || this.isListening) {
      return false;
    }

    // Update language before starting
    this.updateRecognitionLanguage();

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      onError('Failed to start speech recognition');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public getListeningState(): boolean {
    return this.isListening;
  }

  public speak(text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      // Format text for speech and localize
      const formattedText = languageService.formatTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(formattedText);
      
      utterance.rate = options?.rate || 1;
      utterance.pitch = options?.pitch || 1;
      utterance.volume = options?.volume || 1;
      
      // Use provided voice or find best voice for current language
      if (options?.voice) {
        utterance.voice = options.voice;
      } else {
        const bestVoice = languageService.getBestVoiceForLanguage(this.getAvailableVoices());
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      // Set language
      const currentLang = languageService.getCurrentLanguage();
      utterance.lang = currentLang.speechCode;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(event.error));

      this.synthesis.speak(utterance);
    });
  }

  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  public isSpeaking(): boolean {
    return this.synthesis?.speaking || false;
  }

  public getVoicesForLanguage(languageCode?: string): SpeechSynthesisVoice[] {
    const voices = this.getAvailableVoices();
    const targetLang = languageCode || languageService.getCurrentLanguage().code;
    return voices.filter(voice => voice.lang.startsWith(targetLang));
  }

  public detectLanguage(text: string): string {
    // Simple language detection based on character sets
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    if (/[\u0900-\u097f]/.test(text)) return 'hi';
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';
    
    // For Latin-based languages, use current language as default
    return languageService.getCurrentLanguage().code;
  }
}

// Global instance
export const speechService = new SpeechService();
// Type declarations for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}