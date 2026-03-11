# Multi-Language Voice Input Feature

## Overview
The voice input feature now supports 14 languages with automatic browser language detection, allowing users worldwide to describe repair issues verbally in their native language.

## Supported Languages

1. **English (US)** 🇺🇸 - en-US
2. **English (UK)** 🇬🇧 - en-GB
3. **Spanish** 🇪🇸 - es-ES (Español)
4. **French** 🇫🇷 - fr-FR (Français)
5. **German** 🇩🇪 - de-DE (Deutsch)
6. **Italian** 🇮🇹 - it-IT (Italiano)
7. **Portuguese** 🇧🇷 - pt-BR (Português)
8. **Chinese** 🇨🇳 - zh-CN (中文)
9. **Japanese** 🇯🇵 - ja-JP (日本語)
10. **Korean** 🇰🇷 - ko-KR (한국어)
11. **Arabic** 🇸🇦 - ar-SA (العربية)
12. **Russian** 🇷🇺 - ru-RU (Русский)
13. **Hindi** 🇮🇳 - hi-IN (हिन्दी)
14. **Dutch** 🇳🇱 - nl-NL (Nederlands)

## Features

### Automatic Language Detection
- Automatically detects and sets the browser's language on first use
- Falls back to English (US) if browser language is not supported

### Language Selector
- Globe icon button next to microphone for easy language switching
- Visual language picker with flags and native names
- Can change language even during recording (restarts recognition)

### Live Language Switching
- Change recognition language while recording
- Seamlessly restarts speech recognition with new language
- No need to stop and restart manually

### Visual Indicators
- Current language displayed in recording card
- Flag emoji for quick language identification
- Language name shown in both English and native script

## Usage

### Selecting a Language
1. Click the **Globe icon** button next to the microphone
2. Choose your preferred language from the dropdown
3. The system will remember your selection

### Recording in Your Language
1. Ensure correct language is selected
2. Click the **Microphone button** to start recording
3. Speak clearly in your selected language
4. Real-time transcription appears in the recording card
5. Review and edit the transcript if needed
6. Click "Use Text" to add to your message

### Changing Language Mid-Recording
1. While recording, click the **Globe icon**
2. Select a new language
3. Recognition automatically restarts with the new language
4. Previous transcript is preserved

## Technical Implementation

### Language Service
- `src/services/languageService.ts` - Centralized language management
- Language metadata with codes, names, and flags
- Browser language detection utility

### VoiceInput Component
- Dynamic language switching via Web Speech API
- `recognition.lang` property updated on language change
- Automatic recognition restart for live language switching

### State Management
- Selected language persisted in component state
- Automatic browser language detection on mount
- Language change notifications via toast messages

## Browser Compatibility

The Web Speech API with multi-language support works in:
- Chrome/Edge (full support for all languages)
- Safari (limited language support)
- Firefox (experimental support)

**Note:** Language availability may vary by browser and operating system.

## Best Practices

1. **Select Language First**: Choose your language before starting recording
2. **Clear Speech**: Speak clearly for better transcription accuracy
3. **Review Transcript**: Always review auto-generated text before sending
4. **Quiet Environment**: Use in quiet spaces for best results
5. **Native Language**: Use your native language for most accurate results

## Future Enhancements

- Language auto-detection from speech patterns
- Custom language models for technical/repair terminology
- Offline language support
- Translation between languages
- Language preference saving to user profile
