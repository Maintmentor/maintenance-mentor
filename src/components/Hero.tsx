import React, { useState, useEffect } from 'react';
import { MessageCircle, Play, Zap } from 'lucide-react';
import CapacitorDemo from './CapacitorDemo';
import { AuthModal } from './auth/AuthModal';

const Hero = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    console.log('✅ Hero component mounted - Main hero section is now visible');
  }, []);
  return (
    <>
      {showDemo && <CapacitorDemo onClose={() => setShowDemo(false)} />}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        defaultView="signup"
      />

    <div id="home" className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-orange-600 text-white">

      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-orange-300">
                <Zap className="w-5 h-5" />
                <span className="font-semibold">AI-Powered Maintenance Solutions</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Apartment Maintenance
                <span className="text-orange-400"> Made Simple</span>
              </h1>
                <p className="text-xl text-blue-100 max-w-lg">
                  AI-powered repair and troubleshooting guidance for residential apartment maintenance. 
                  Get instant expert help for HVAC, plumbing, electrical, appliances, and more. 
                  Trusted by maintenance techs and property managers nationwide.
                </p>


            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Start Free Trial</span>
              </button>

              <button 
                onClick={() => setShowDemo(true)}
                className="border-2 border-white/30 hover:border-white text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Apartment-Specific</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Instant Answers</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>24/7 AI Support</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <img 
              src="https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759260025519_b00e512d.webp"
              alt="Apartment Maintenance Platform"
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Hero;

