import React, { useState } from 'react';
import { Mic, MessageCircle, Volume2, Headphones, Sparkles, ArrowRight, Play, Pause, Send, Bot, User, Zap, Globe, Brain, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const AIDemo = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I can help you with any home repair questions. Try asking me about plumbing, electrical, HVAC, or any maintenance issue!' }
  ]);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const voiceCommands = [
    "What's wrong with my AC?",
    "How do I fix a leaky faucet?",
    "Why is my circuit breaker tripping?",
    "How much does a water heater cost?"
  ];

  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    // Simulate voice recognition
    if (!isListening) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, 
          { role: 'user', content: "My AC is making a strange noise" },
          { role: 'assistant', content: "I can help diagnose that! A strange noise from your AC could indicate several issues: rattling might mean loose parts, squealing could be a belt problem, and buzzing might indicate electrical issues. Can you describe the type of noise?" }
        ]);
        setIsListening(false);
      }, 3000);
    }
  };

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      setChatMessages(prev => [...prev, 
        { role: 'user', content: currentMessage },
        { role: 'assistant', content: `I understand you're asking about "${currentMessage}". Let me provide you with detailed guidance on this repair issue...` }
      ]);
      setCurrentMessage('');
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-lg">
            AI-Powered Assistant
          </Badge>
          <h2 className="text-6xl font-bold text-gray-900 mb-6">
            Talk or Type to Our AI Expert
          </h2>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto">
            Get instant repair guidance through voice commands or text chat. 
            Our AI understands your problems and provides expert solutions in any language.
          </p>
        </div>

        {/* Main Demo Area */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Voice Section */}
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-600 rounded-lg text-white mr-4">
                <Mic className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">Voice Commands</h3>
                <p className="text-gray-600">Speak naturally in any language</p>
              </div>
            </div>

            {/* Language Selector */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Language</label>
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
                  <Button
                    key={lang}
                    variant={selectedLanguage === lang ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLanguage(lang)}
                    className={selectedLanguage === lang ? "bg-blue-600" : ""}
                  >
                    {lang}
                  </Button>
                ))}
              </div>
            </div>

            {/* Voice Button */}
            <div className="flex justify-center mb-8">
              <Button
                size="lg"
                onClick={handleVoiceToggle}
                className={`w-48 h-48 rounded-full transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                <div className="flex flex-col items-center">
                  {isListening ? (
                    <>
                      <Volume2 className="w-16 h-16 mb-2 animate-pulse" />
                      <span className="text-lg font-semibold">Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-16 h-16 mb-2" />
                      <span className="text-lg font-semibold">Press to Talk</span>
                    </>
                  )}
                </div>
              </Button>
            </div>

            {/* Sample Commands */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Try saying:</p>
              <div className="space-y-2">
                {voiceCommands.map((command, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => setCurrentMessage(command)}
                  >
                    <p className="text-gray-700 italic">"{command}"</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Chat Section */}
          <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-600 rounded-lg text-white mr-4">
                <MessageCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">Text Chat</h3>
                <p className="text-gray-600">Type your questions below</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto mb-4 p-4 bg-white rounded-lg border border-gray-200">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-blue-600 ml-2' : 'bg-purple-600 mr-2'}`}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                    </div>
                    <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <p className="text-gray-800">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your repair question..."
                className="flex-1 text-lg"
              />
              <Button 
                onClick={handleSendMessage}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg w-fit mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold mb-2">Smart AI Brain</h4>
            <p className="text-gray-600">Understands context and provides accurate repair solutions</p>
          </Card>
          
          <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg w-fit mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold mb-2">40+ Languages</h4>
            <p className="text-gray-600">Communicate in your preferred language seamlessly</p>
          </Card>
          
          <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg w-fit mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold mb-2">Instant Response</h4>
            <p className="text-gray-600">Get answers in seconds, not hours or days</p>
          </Card>
          
          <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg w-fit mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold mb-2">Expert Verified</h4>
            <p className="text-gray-600">Backed by professional repair knowledge</p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-16 text-white shadow-2xl">
          <h3 className="text-4xl font-bold mb-6">Experience the Future of Home Repair</h3>
          <p className="text-2xl mb-10 opacity-95 max-w-3xl mx-auto">
            Join thousands of homeowners getting instant expert repair guidance through AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              <Headphones className="mr-2 w-6 h-6" />
              Try Voice Assistant
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              <MessageCircle className="mr-2 w-6 h-6" />
              Start Text Chat
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIDemo;