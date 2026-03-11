import React, { useState, useEffect, useRef } from 'react';
import { Users, Wrench, Clock, TrendingDown } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: 2500,
    suffix: '+',
    label: 'Active Users',
    description: 'Maintenance professionals trust us',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    icon: Wrench,
    value: 150000,
    suffix: '+',
    label: 'Repairs Diagnosed',
    description: 'AI-powered diagnostics completed',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    icon: Clock,
    value: 45,
    suffix: '%',
    label: 'Time Saved',
    description: 'Average reduction in repair time',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    icon: TrendingDown,
    value: 35,
    suffix: '%',
    label: 'Cost Reduction',
    description: 'Average decrease in vendor costs',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
];

function useCountUp(target: number, duration: number = 2000, shouldStart: boolean = false) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!shouldStart) return;
    
    let startTime: number | null = null;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, shouldStart]);
  
  return count;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
  }
  return num.toLocaleString();
}

const StatCard = ({ stat, shouldAnimate }: { stat: typeof stats[0]; shouldAnimate: boolean }) => {
  const IconComponent = stat.icon;
  const count = useCountUp(stat.value, 2000, shouldAnimate);
  
  return (
    <div className="text-center p-8 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-xl ${stat.bgColor} flex items-center justify-center mx-auto mb-4`}>
        <IconComponent className={`w-7 h-7 ${stat.color}`} />
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-1">
        {formatNumber(count)}{stat.suffix}
      </div>
      <div className="text-lg font-semibold text-gray-700 mb-1">{stat.label}</div>
      <div className="text-sm text-gray-500">{stat.description}</div>
    </div>
  );
};

const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} shouldAnimate={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
