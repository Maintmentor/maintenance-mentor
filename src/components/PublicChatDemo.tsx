import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, User, Bot, Wrench, DollarSign, Clock, Sparkles, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    category?: string;
    estimatedCost?: string;
    difficulty?: string;
  };
}

export default function PublicChatDemo() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hi! I'm your AI Maintenance Mentor. Describe any repair issue and I'll provide expert guidance. Try asking about HVAC, plumbing, electrical, appliances, or pool maintenance!",
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputMessage('');

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `**Diagnosis:** Based on your description, here's my analysis.\n\n**Steps:**\n1. Ensure safety first\n2. Inspect the area\n3. Check connections\n4. Test after repairs\n\n⚠️ **Safety Note:** Consult a pro if unsure.\n\n✨ *Sign up for photo uploads, detailed cost estimates & personalized guidance!*`,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          category: 'General Repair',
          estimatedCost: '$50-150',
          difficulty: 'Medium'
        }
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Card className="h-full flex flex-col bg-white">
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-orange-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">AI Repair Assistant - Demo</h3>
              <p className="text-sm text-blue-50">Try it now! Ask about any repair.</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/dashboard')}
            size="sm"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign Up
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%]`}>
              <div className="flex items-center gap-2 mb-1">
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-blue-600" />
                ) : (
                  <Bot className="w-4 h-4 text-green-600" />
                )}
                <span className="text-sm font-medium">
                  {message.role === 'user' ? 'You' : 'AI Mentor'}
                </span>
              </div>
              
              <Card className={`p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
                
                {message.metadata && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                    <Badge variant="secondary" className="text-xs">
                      <Wrench className="w-3 h-3 mr-1" />
                      {message.metadata.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {message.metadata.estimatedCost}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {message.metadata.difficulty}
                    </Badge>
                  </div>
                )}
              </Card>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <Card className="p-3 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200" />
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Try: 'My AC isn't cooling properly...'"
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
