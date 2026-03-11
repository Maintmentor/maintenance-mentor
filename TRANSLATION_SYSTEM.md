# Real-Time Translation System

## Overview
The application now features a comprehensive real-time translation system that automatically translates voice transcripts between multiple languages, enabling users to speak in their native language while the AI receives English input for optimal understanding.

## Features

### 1. **Automatic Translation**
- Voice transcripts are automatically translated from the user's language to English
- AI responses can be translated back to the user's language
- Translation happens in real-time with visual feedback

### 2. **Translation Caching**
- Translations are cached in the database to reduce API calls
- Cache hit rate tracking and analytics
- Automatic cache usage for repeated phrases
- Significant cost savings on translation API calls

### 3. **Bidirectional Translation**
- **User → AI**: Translates user's native language to English for AI processing
- **AI → User**: Translates AI responses back to user's language (optional)
- Original text is preserved alongside translations

### 4. **Multi-Language Support**
- Supports 14 languages via voice input
- Automatic browser language detection
- Language selection persists during session
- Visual language indicators with flags

### 5. **Translation History**
- All translations are logged to the database
- Tracks source/target languages
- Links translations to conversations
- Enables analytics and improvement

## Components

### TranslationManager
**Location**: `src/components/translation/TranslationManager.tsx`

User interface for managing translation preferences:
- Enable/disable auto-translation
- Choose source language (or auto-detect)
- Toggle AI response translation
- View cache statistics (entries, uses, hit rate)

### TranslationIndicator
**Location**: `src/components/translation/TranslationIndicator.tsx`

Visual badge showing translation status:
- Displays when translation is in progress
- Shows source → target language pair
- Indicates cached vs. fresh translations
- Tooltip with detailed information

### Updated VoiceInput
**Location**: `src/components/chat/VoiceInput.tsx`

Enhanced with translation capabilities:
- Detects non-English languages
- Automatically translates before sending
- Shows translation progress
- Passes both translated and original text

## Backend Services

### Translation Edge Function
**Name**: `translation-service`
**Endpoint**: `/functions/v1/translation-service`

Handles translation requests:
- Checks cache before calling OpenAI API
- Uses GPT-4o-mini for cost-effective translations
- Updates cache usage statistics
- Returns translation with metadata

### Translation Service
**Location**: `src/services/translationService.ts`

Client-side service providing:
- `translate()` - Translate text between languages
- `getPreferences()` - Get user translation settings
- `updatePreferences()` - Save translation settings
- `saveToHistory()` - Log translations to database
- `getCacheStats()` - Get cache analytics

## Database Tables

### translation_cache
Stores cached translations:
- `source_text` - Original text
- `source_language` - Source language code
- `target_language` - Target language code
- `translated_text` - Translated result
- `use_count` - Number of times used
- `last_used_at` - Last access timestamp

### translation_preferences
User translation settings:
- `user_id` - User reference
- `source_language` - Preferred source language
- `target_language` - Preferred target language
- `auto_translate_enabled` - Auto-translate toggle
- `translate_ai_responses` - Translate AI responses toggle

### translation_history
Translation audit log:
- `user_id` - User reference
- `conversation_id` - Conversation reference
- `original_text` - Original text
- `translated_text` - Translated text
- `source_language` - Source language
- `target_language` - Target language
- `translation_type` - 'user_to_ai' or 'ai_to_user'

## Usage Flow

### Voice Input with Translation

1. **User speaks in native language**
   - VoiceInput detects language selection
   - Web Speech API transcribes speech

2. **Translation check**
   - If language is not English, check user preferences
   - If auto-translate enabled, translate to English

3. **Cache lookup**
   - Check if translation exists in cache
   - Use cached translation if available
   - Otherwise, call OpenAI API

4. **Send to AI**
   - AI receives English text for processing
   - Original text preserved in conversation metadata

5. **AI Response (optional)**
   - If translate_ai_responses enabled
   - Translate AI response back to user's language
   - Display translated response to user

## Configuration

### User Settings
Users can configure translation via the TranslationManager:
- Navigate to Profile → Translation Settings
- Choose preferred language
- Enable/disable auto-translation
- Toggle AI response translation

### Default Settings
- Source Language: Auto-detect
- Target Language: English (en-US)
- Auto-translate: Enabled
- Translate AI Responses: Enabled

## Performance

### Cache Benefits
- **Reduced API Calls**: Repeated phrases use cache
- **Faster Response**: Cached translations return instantly
- **Cost Savings**: Significant reduction in OpenAI API costs
- **Analytics**: Track cache hit rate and usage patterns

### Cache Statistics
View in TranslationManager:
- Total cached translations
- Total cache uses
- Cache hit rate percentage

## Integration Points

### Chat Interface
- VoiceInput component handles translation automatically
- Translation indicator shows when active
- Original and translated text both available

### Conversation Storage
- Translations linked to conversations
- History enables analytics and improvements
- Original language preserved

### Analytics
- Track translation usage by language
- Monitor cache performance
- Identify common phrases for optimization

## Future Enhancements

1. **Language Detection**
   - Automatic detection of spoken language
   - No manual language selection needed

2. **Offline Translation**
   - Cache popular phrases for offline use
   - Local translation models for privacy

3. **Custom Translations**
   - User-editable translations
   - Domain-specific terminology

4. **Translation Quality**
   - User feedback on translations
   - Continuous improvement via ML

## API Keys Required

- **OPENAI_API_KEY**: For translation via GPT-4o-mini
  - Already configured in edge functions
  - Cost-effective model for translations

## Testing

### Test Translation
1. Open chat interface
2. Click microphone button
3. Select non-English language (e.g., Spanish)
4. Speak in selected language
5. Observe translation indicator
6. Verify English text sent to AI

### Test Cache
1. Translate same phrase twice
2. Second translation should show "(cached)"
3. Check cache statistics in TranslationManager
4. Verify use_count incremented

### Test Preferences
1. Open TranslationManager
2. Disable auto-translation
3. Speak in non-English language
4. Verify original language sent (no translation)

## Troubleshooting

### Translation Not Working
- Check OPENAI_API_KEY is configured
- Verify user preferences allow translation
- Ensure language is not English
- Check browser console for errors

### Cache Not Working
- Verify translation_cache table exists
- Check RLS policies allow reads
- Ensure exact text match (case-sensitive)

### Slow Translations
- First translation always calls API
- Subsequent identical phrases use cache
- Check network connection
- Monitor OpenAI API status

## Support

For issues or questions:
1. Check browser console for errors
2. Verify edge function deployment
3. Test with simple phrases first
4. Review translation history in database
