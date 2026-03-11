import React, { useState } from 'react';
import { MessageCircle, Play, Zap, Wrench, Camera, BarChart3, Shield, CheckCircle } from 'lucide-react';
import CapacitorDemo from './CapacitorDemo';
import { AuthModal } from './auth/AuthModal';

const Hero = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      {showDemo && <CapacitorDemo onClose={() => setShowDemo(false)} />}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="signup"
      />

      <div id="home" className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-orange-600 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

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

            {/* Hero Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 shadow-2xl">
                  {/* Chat mockup header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">AI Repair Assistant</div>
                      <div className="text-green-300 text-xs flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        Online
                      </div>
                    </div>
                  </div>

                  {/* Chat messages mockup */}
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <div className="bg-blue-500/80 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                        <p className="text-sm text-white">My AC unit is making a buzzing noise and not cooling</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white/20 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%]">
                        <p className="text-sm text-white/90">Based on the symptoms, this is likely a capacitor issue. Here's what to check:</p>
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-green-300">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Check the run capacitor for bulging</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-green-300">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Test with multimeter (45+5 MFD)</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-green-300">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Replacement part: ~$15-25</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input mockup */}
                  <div className="mt-6 flex items-center gap-2">
                    <div className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 text-sm text-white/40 border border-white/10">
                      Describe your issue or upload a photo...
                    </div>
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2 animate-bounce">
                  <Shield className="w-4 h-4" />
                  AI Powered
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  150K+ Repairs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
