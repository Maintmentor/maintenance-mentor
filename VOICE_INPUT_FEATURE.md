# Voice-to-Text Input Feature

## Overview
Added comprehensive voice-to-text functionality to the chat interface, allowing users to describe repair issues verbally instead of typing. This is especially useful when users have their hands full during repairs.

## Features Implemented

### 1. VoiceInput Component (`src/components/chat/VoiceInput.tsx`)
- **Web Speech API Integration**: Uses browser's native speech recognition
- **Real-time Transcription**: Shows transcribed text as you speak
- **Visual Recording Indicator**: Animated red dot when recording
- **Review & Edit**: Users can review transcribed text before sending
- **Browser Compatibility**: Supports Chrome, Edge, Safari (with webkit prefix)
- **Error Handling**: Graceful handling of microphone permissions and API errors

### 2. UI/UX Features
- **Microphone Button**: Icon button next to send button
- **Recording Animation**: Pulsing red button when active
- **Transcript Preview Card**: Floating card showing live transcription
- **Accept/Cancel Actions**: Review and confirm or discard transcript
- **Seamless Integration**: Transcript appends to existing input text

### 3. User Flow
1. Click microphone button to start recording
2. Speak your repair question
3. See real-time transcription in preview card
4. Click "Use Text" to add to message input
5. Edit if needed, then send message

## Technical Implementation

### Web Speech API
```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';
```

### State Management
- `isRecording`: Controls recording state
- `transcript`: Final transcribed text
- `interimTranscript`: In-progress transcription
- Automatic cleanup on component unmount

### Error Handling
- Microphone permission denied
- No speech detected
- Browser not supported
- Network errors

## Browser Support
- ✅ Chrome/Edge (native support)
- ✅ Safari (webkit prefix)
- ❌ Firefox (limited support)

## Usage Example
1. User clicks microphone button
2. Says: "My kitchen faucet is leaking from the base"
3. Reviews transcription in preview card
4. Clicks "Use Text" to add to input
5. Optionally edits: "My kitchen faucet is leaking from the base when I turn it on"
6. Sends message with camera button for images if needed

## Benefits
- **Hands-free Operation**: Perfect for users working on repairs
- **Faster Input**: Speak naturally instead of typing
- **Accessibility**: Helps users with typing difficulties
- **Multilingual**: Can be extended to support multiple languages
- **Mobile-Friendly**: Works great on mobile devices

## Future Enhancements
- Multiple language support
- Voice commands (e.g., "send", "cancel")
- Offline speech recognition
- Custom vocabulary for repair terms
- Voice activity detection
