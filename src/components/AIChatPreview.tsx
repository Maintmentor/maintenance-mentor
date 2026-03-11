import React, { useState } from 'react';
import { MessageCircle, Wrench, Droplet, Zap, ArrowRight, Sparkles, CheckCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthModal } from '@/components/auth/AuthModal';

const exampleConversations = [
  {
    icon: Droplet,
    question: "Tenant reports low water pressure in bathroom sink",
    answer: "Let's diagnose this quickly. Check the aerator first - unscrew it and clean any debris. If that doesn't work, check the shut-off valves under the sink. I'll walk you through each step with photos...",
    category: "Plumbing"
  },
  {
    icon: Zap,
    question: "HVAC unit not cooling - tenant complaint",
    answer: "First, check the thermostat settings and air filter. If the filter is dirty, replace it. Next, inspect the outdoor unit for debris. I can guide you through checking refrigerant levels and compressor function...",
    category: "HVAC"
  },
  {
    icon: Wrench,
    question: "Dishwasher leaking from bottom door seal",
    answer: "This is usually a worn door gasket. You'll need a replacement gasket for the specific model. I'll help you identify the model number, order the part, and install it step-by-step...",
    category: "Appliances"
  }
];

const features = [
  "Photo analysis - Upload images for instant diagnosis",
  "Step-by-step repair instructions with videos",
  "Parts identification and supplier links",
  "Work order documentation and history"
];

export default function AIChatPreview() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">AI-Powered Maintenance Assistant</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">See Our AI Chat Agent in Action</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant diagnostic help and repair guidance for apartment maintenance issues
          </p>
        </div>

        {/* Example Conversations */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {exampleConversations.map((conv, idx) => (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <conv.icon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-blue-600">{conv.category}</span>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{conv.question}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{conv.answer}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <Camera className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h3 className="text-3xl font-bold mb-4">Start Solving Maintenance Issues Faster</h3>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join maintenance teams using AI to diagnose problems, find solutions, and complete repairs in half the time
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto"
          >
            Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="mt-4 text-sm text-white/80">7-day free trial • $0.50 per bed/month after trial</p>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView={authMode}
      />

    </section>
  );
}
