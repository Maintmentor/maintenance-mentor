import { speechService } from './speechService';
import { translationService, TranslationResult } from './translationService';
import { languageService } from './languageService';

export interface VoiceTranslationSession {
  inputLanguage: string;
  outputLanguage: string;
  isActive: boolean;
  conversationHistory: VoiceTranslationEntry[];
}

export interface VoiceTranslationEntry {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  timestamp: Date;
  isUserInput: boolean;
}

export interface VoiceCommand {
  command: string;
  languages: string[];
  action: () => void;
}

class VoiceTranslationService {
  private session: VoiceTranslationSession | null = null;
  private isListening = false;
  private isSpeaking = false;
  private onTranslationCallback: ((entry: VoiceTranslationEntry) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private voiceCommands: VoiceCommand[] = [];

  constructor() {
    this.initializeVoiceCommands();
  }

  private initializeVoiceCommands() {
    this.voiceCommands = [
      {
        command: 'switch languages',
        languages: ['en', 'es', 'fr', 'de'],
        action: () => this.switchLanguages()
      },
      {
        command: 'cambiar idiomas',
        languages: ['es'],
        action: () => this.switchLanguages()
      },
      {
        command: 'changer de langue',
        languages: ['fr'],
        action: () => this.switchLanguages()
      },
      {
        command: 'sprache wechseln',
        languages: ['de'],
        action: () => this.switchLanguages()
      },
      {
        command: 'stop translation',
        languages: ['en'],
        action: () => this.stopSession()
      },
      {
        command: 'repeat last',
        languages: ['en'],
        action: () => this.repeatLastTranslation()
      }
    ];
  }

  public startSession(inputLang: string, outputLang: string): boolean {
    if (!speechService.isSupported()) {
      this.onErrorCallback?.('Voice translation not supported on this device');
      return false;
    }

    this.session = {
      inputLanguage: inputLang,
      outputLanguage: outputLang,
      isActive: true,
      conversationHistory: []
    };

    return true;
  }

  public async startListening(
    onTranslation: (entry: VoiceTranslationEntry) => void,
    onError: (error: string) => void
  ): Promise<boolean> {
    if (!this.session || this.isListening) {
      return false;
    }

    this.onTranslationCallback = onTranslation;
    this.onErrorCallback = onError;

    // Set speech recognition to input language
    const inputLang = languageService.getLanguageByCode(this.session.inputLanguage);
    if (inputLang) {
      languageService.setCurrentLanguage(inputLang.code);
    }

    return speechService.startListening(
      (text) => this.handleVoiceInput(text),
      (error) => this.onErrorCallback?.(error)
    );
  }

  private async handleVoiceInput(text: string): Promise<void> {
    if (!this.session) return;

    this.isListening = false;

    // Check for voice commands first
    if (this.processVoiceCommand(text)) {
      return;
    }

    // Detect language from speech if needed
    const detectedLang = speechService.detectLanguage(text);
    
    try {
      // Translate the input text
      const translationResult = await translationService.translateText(
        text,
        this.session.outputLanguage,
        detectedLang,
        'conversation'
      );

      // Create translation entry
      const entry: VoiceTranslationEntry = {
        id: Date.now().toString(),
        originalText: text,
        translatedText: translationResult.translation,
        sourceLanguage: detectedLang,
        targetLanguage: this.session.outputLanguage,
        confidence: translationResult.confidence,
        timestamp: new Date(),
        isUserInput: true
      };

      // Add to conversation history
      this.session.conversationHistory.push(entry);

      // Speak the translation
      await this.speakTranslation(translationResult.translation, this.session.outputLanguage);

      // Notify callback
      this.onTranslationCallback?.(entry);

    } catch (error) {
      this.onErrorCallback?.(`Translation failed: ${error}`);
    }
  }

  private async speakTranslation(text: string, language: string): Promise<void> {
    if (this.isSpeaking) {
      speechService.stopSpeaking();
    }

    this.isSpeaking = true;

    try {
      // Get best voice for target language
      const voices = speechService.getVoicesForLanguage(language);
      const bestVoice = voices.find(v => v.lang.startsWith(language)) || voices[0];

      await speechService.speak(text, {
        voice: bestVoice,
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0
      });
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    } finally {
      this.isSpeaking = false;
    }
  }

  public async translateAndSpeak(
    text: string,
    targetLanguage?: string,
    isAIResponse: boolean = false
  ): Promise<VoiceTranslationEntry | null> {
    if (!this.session) return null;

    const target = targetLanguage || this.session.outputLanguage;
    const source = isAIResponse ? 'en' : this.session.inputLanguage;

    try {
      const translationResult = await translationService.translateText(
        text,
        target,
        source,
        'repair'
      );

      const entry: VoiceTranslationEntry = {
        id: Date.now().toString(),
        originalText: text,
        translatedText: translationResult.translation,
        sourceLanguage: source,
        targetLanguage: target,
        confidence: translationResult.confidence,
        timestamp: new Date(),
        isUserInput: !isAIResponse
      };

      this.session.conversationHistory.push(entry);

      // Speak the translation
      await this.speakTranslation(translationResult.translation, target);

      return entry;
    } catch (error) {
      this.onErrorCallback?.(`Translation failed: ${error}`);
      return null;
    }
  }

  private processVoiceCommand(text: string): boolean {
    const lowerText = text.toLowerCase();
    const currentLang = this.session?.inputLanguage || 'en';

    for (const command of this.voiceCommands) {
      if (command.languages.includes(currentLang) && 
          lowerText.includes(command.command.toLowerCase())) {
        command.action();
        return true;
      }
    }

    return false;
  }

  private switchLanguages(): void {
    if (!this.session) return;

    const temp = this.session.inputLanguage;
    this.session.inputLanguage = this.session.outputLanguage;
    this.session.outputLanguage = temp;

    // Update speech recognition language
    const newInputLang = languageService.getLanguageByCode(this.session.inputLanguage);
    if (newInputLang) {
      languageService.setCurrentLanguage(newInputLang.code);
    }

    this.onTranslationCallback?.({
      id: Date.now().toString(),
      originalText: 'Languages switched',
      translatedText: 'Idiomas cambiados',
      sourceLanguage: 'system',
      targetLanguage: 'system',
      confidence: 1.0,
      timestamp: new Date(),
      isUserInput: false
    });
  }

  private async repeatLastTranslation(): Promise<void> {
    if (!this.session || this.session.conversationHistory.length === 0) return;

    const lastEntry = this.session.conversationHistory[this.session.conversationHistory.length - 1];
    await this.speakTranslation(lastEntry.translatedText, lastEntry.targetLanguage);
  }

  public stopListening(): void {
    speechService.stopListening();
    this.isListening = false;
  }

  public stopSpeaking(): void {
    speechService.stopSpeaking();
    this.isSpeaking = false;
  }

  public stopSession(): void {
    this.stopListening();
    this.stopSpeaking();
    
    if (this.session) {
      this.session.isActive = false;
    }
  }

  public getSession(): VoiceTranslationSession | null {
    return this.session;
  }

  public isSessionActive(): boolean {
    return this.session?.isActive || false;
  }

  public getConversationHistory(): VoiceTranslationEntry[] {
    return this.session?.conversationHistory || [];
  }

  public clearHistory(): void {
    if (this.session) {
      this.session.conversationHistory = [];
    }
  }
}

export const voiceTranslationService = new VoiceTranslationService();