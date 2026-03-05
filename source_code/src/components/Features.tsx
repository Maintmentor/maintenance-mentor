import React from 'react';
import { Bot, BarChart3, Search } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Maintenance Troubleshooting',
    description: 'Advanced AI analyzes your maintenance needs, provides intelligent recommendations, and helps diagnose issues with photo analysis',
    color: 'text-blue-600'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Comprehensive insights into maintenance costs, repair frequency, and system performance with exportable reports',
    color: 'text-cyan-600'
  },
  {
    icon: Search,
    title: 'Parts Search',
    description: 'Intelligent parts sourcing with HD Supply as primary source. Get direct links, part numbers, and pricing for all maintenance needs',
    color: 'text-orange-600'
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ROI
          </h2>
          
          <div className="space-y-2 text-xl text-gray-700 max-w-3xl mx-auto">
            <p>On the go training for your team's needs.</p>

            <p>Faster repairs.</p>
            <p>Lower vendor cost.</p>
            <p>Better, faster customer service.</p>
            <p>Employee retention.</p>
          </div>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index}
                className="group p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <IconComponent className={`w-6 h-6 ${feature.color}`} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
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
