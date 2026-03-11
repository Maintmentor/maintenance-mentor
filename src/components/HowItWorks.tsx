import React from 'react';
import { Camera, Bot, Wrench, CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Camera,
    title: 'Describe or Photo',
    description: 'Describe your maintenance issue or upload a photo of the problem. Our AI understands both text and images.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    number: '02',
    icon: Bot,
    title: 'AI Diagnosis',
    description: 'Our AI instantly analyzes the issue, identifies the root cause, and provides a detailed diagnosis with confidence scores.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    number: '03',
    icon: Wrench,
    title: 'Step-by-Step Guide',
    description: 'Get a clear, step-by-step repair guide with safety warnings, required tools, estimated time, and cost breakdowns.',
    color: 'from-orange-500 to-orange-600'
  },
  {
    number: '04',
    icon: CheckCircle,
    title: 'Parts & Completion',
    description: 'Find exact replacement parts with links and pricing. Track the repair in your history for future reference.',
    color: 'from-green-500 to-green-600'
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm font-medium mb-4">
            <ArrowRight className="w-4 h-4 mr-2" />
            Simple Process
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From problem to solution in minutes, not hours. Our AI-powered platform streamlines the entire repair process.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 z-0" />
                )}
                
                <div className="relative z-10 text-center">
                  {/* Step number */}
                  <div className="text-6xl font-black text-gray-100 mb-2">{step.number}</div>
                  
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg -mt-8`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
