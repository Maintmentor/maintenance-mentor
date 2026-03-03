import React, { useState, useEffect } from 'react';
import { X, Bot, Send, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface DemoMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  images?: string[];
}

const CapacitorDemo = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const demoConversation = [
    {
      sender: 'user' as const,
      content: 'My Goodman AC unit is not starting. It just hums but won\'t turn on.',
      images: []
    },
    {
      sender: 'ai' as const,
      content: 'I can help you diagnose this issue. Based on your description, this sounds like it could be a capacitor problem. The humming sound typically indicates the compressor is trying to start but can\'t.\n\nLet me guide you through checking the capacitor:\n\n1. First, turn off power at the breaker\n2. Remove the access panel on your outdoor unit\n3. Take a photo of the capacitor (cylindrical component)\n\nCan you upload a photo of the capacitor?',
      images: []
    },
    {
      sender: 'user' as const,
      content: 'Here\'s a photo of the capacitor',
      images: ['https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1758388832948_c0666d81.webp']
    },
    {
      sender: 'ai' as const,
      content: 'Perfect! I can see your dual-run capacitor. I notice it appears to be bulging at the top, which is a clear sign of failure.\n\nThis is a 45+5 MFD capacitor that powers both your compressor and fan motor. Here\'s what you need:\n\n✓ Replacement: 45+5 MFD 370V Dual Run Capacitor\n✓ Estimated cost: $15-25\n✓ Difficulty: Moderate (requires electrical knowledge)\n\n⚠️ Safety steps:\n1. Confirm power is OFF\n2. Discharge the capacitor with an insulated screwdriver\n3. Take a photo of wire connections before removing\n4. Match wire colors when installing new capacitor\n\nWould you like me to find replacement parts or show you installation steps?',
      images: []
    }
  ];

  useEffect(() => {
    if (currentStep < demoConversation.length) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            ...demoConversation[currentStep]
          }]);
          setIsTyping(false);
          setCurrentStep(prev => prev + 1);
        }, 1500);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header - matching ChatInterface */}
        <div className="bg-white border-b px-6 py-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI Maintenance Assistant</h2>
              <p className="text-sm text-gray-500">Interactive Demo</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Demo!</h3>
              <p className="text-gray-600 max-w-md">
                Watch how our AI assistant helps diagnose and solve maintenance issues
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%]">
                  {msg.sender === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">AI Assistant</span>
                    </div>
                  )}
                  
                  <Card className={`p-4 ${msg.sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-white'}`}>
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {msg.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="w-32 h-32 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                  </Card>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">AI is analyzing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area - matching ChatInterface */}
        <div className="border-t bg-white px-4 py-4 shadow-lg">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Button variant="outline" disabled className="h-12">
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Input 
              placeholder="Ask a question or upload images..." 
              disabled 
              className="flex-1 h-12 text-base" 
            />
            <Button disabled className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600">
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">This is a demo - sign up to try the real AI assistant!</p>
        </div>
      </div>
    </div>
  );
};

export default CapacitorDemo;
