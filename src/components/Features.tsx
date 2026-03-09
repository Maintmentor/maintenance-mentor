import React, { useState } from 'react';
import { Bot, BarChart3, Search, Camera, Video, Shield, Clock, Wrench, BookOpen, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Diagnostics',
    description: 'Advanced AI analyzes your maintenance needs, provides intelligent recommendations, and helps diagnose issues with photo analysis.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'hover:border-blue-200'
  },
  {
    icon: Camera,
    title: 'Photo Analysis',
    description: 'Upload photos of broken parts or equipment and get instant AI-powered identification, diagnosis, and repair instructions.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'hover:border-purple-200'
  },
  {
    icon: Search,
    title: 'Parts Search & Sourcing',
    description: 'Intelligent parts sourcing with HD Supply as primary source. Get direct links, part numbers, and pricing for all maintenance needs.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'hover:border-orange-200'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Comprehensive insights into maintenance costs, repair frequency, and system performance with exportable reports.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'hover:border-cyan-200'
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    description: 'Access a growing library of step-by-step repair videos covering HVAC, plumbing, electrical, appliances, and more.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'hover:border-red-200'
  },
  {
    icon: Clock,
    title: 'Maintenance Scheduling',
    description: 'Automated preventive maintenance reminders and scheduling to reduce emergency repairs and extend equipment life.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'hover:border-green-200'
  },
  {
    icon: Wrench,
    title: 'Repair History Tracking',
    description: 'Complete digital record of all repairs with photos, costs, parts used, and technician notes for every unit.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'hover:border-amber-200'
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base',
    description: 'Searchable database of repair guides, troubleshooting tips, and best practices curated by industry experts.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'hover:border-indigo-200'
  },
  {
    icon: Shield,
    title: 'Warranty & Compliance',
    description: 'Track warranties, manage compliance documentation, and ensure all repairs meet building codes and safety standards.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'hover:border-teal-200'
  }
];

const Features = () => {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
            <Wrench className="w-4 h-4 mr-2" />
            Why Maintenance Mentor
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ROI That Speaks for Itself
          </h2>
          
          <div className="space-y-2 text-xl text-gray-700 max-w-3xl mx-auto">
            <p>On the go training for your team's needs.</p>
            <p className="font-semibold text-blue-600">Faster repairs. Lower vendor cost. Better customer service. Employee retention.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const isExpanded = expandedFeature === index;
            return (
              <div 
                key={index}
                className={`group p-8 rounded-2xl border border-gray-100 ${feature.borderColor} hover:shadow-lg transition-all duration-300 cursor-pointer ${isExpanded ? 'ring-2 ring-blue-200 shadow-lg' : ''}`}
                onClick={() => setExpandedFeature(isExpanded ? null : index)}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <IconComponent className={`w-6 h-6 ${feature.color}`} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center justify-between">
                  {feature.title}
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} group-hover:text-gray-600`} />
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button 
                      className={`text-sm font-medium ${feature.color} hover:underline flex items-center gap-1`}
                      onClick={(e) => {
                        e.stopPropagation();
                        document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Get started with this feature
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export { Features };
export default Features;
