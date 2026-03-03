import React, { useState, useMemo, useEffect } from 'react';
import { Star, Quote, Filter, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  image: string;
  rating: number;
  content: string;
  date: string;
  user_id?: string;
}

// Default testimonials for when database is empty
const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Marcus Thompson',
    role: 'Lead HVAC Technician',
    company: 'CoolAir Solutions',
    industry: 'HVAC',
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759599115167_97c1c991.webp',
    rating: 5,
    content: 'Maintenance Mentor has revolutionized our HVAC service operations. The AI diagnostics accurately identify issues before we even arrive on-site, saving us countless hours. The parts tracking feature ensures we always have what we need in stock. Our customer satisfaction scores have increased by 40% since implementation.',
    date: '2024-09-15'
  },
  {
    id: '2',
    name: 'Jessica Rivera',
    role: 'Master Plumber',
    company: 'Rivera Plumbing Co.',
    industry: 'Plumbing',
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759599116349_e2aae72c.webp',
    rating: 5,
    content: 'As a small business owner, efficiency is everything. Maintenance Mentor\'s repair history and photo documentation have been game-changers. I can show clients exactly what was done, track recurring issues, and provide accurate quotes instantly. It\'s like having a full administrative team in my pocket.',
    date: '2024-08-22'
  },
  {
    id: '3',
    name: 'David Patterson',
    role: 'Property Manager',
    company: 'Skyline Properties',
    industry: 'Property Management',
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759599117176_528ca780.webp',
    rating: 5,
    content: 'Managing 300+ residential units, we needed a solution that could scale. Maintenance Mentor delivers beyond expectations. The analytics dashboard shows exactly where our maintenance budget goes, helping us make data-driven decisions. The automated reminders have reduced emergency repairs by 35%.',
    date: '2024-09-01'
  },
  {
    id: '4',
    name: 'Amanda Foster',
    role: 'Facilities Director',
    company: 'TechHub Campus',
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759599117914_3eade7c9.webp',
    rating: 5,
    content: 'Running a 500,000 sq ft tech campus requires precision. Maintenance Mentor\'s preventive maintenance scheduling and real-time tracking keep our facilities running smoothly. The ROI was evident within the first month - we\'ve cut maintenance costs by 28% while improving response times.',
    date: '2024-07-18'
  },
  {
    id: '5',
    name: 'Robert Chen',
    role: 'Senior Electrician',
    company: 'Bright Electric Services',
    industry: 'Electrical',
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759599118632_310889a1.webp',
    rating: 5,
    content: 'After 25 years in the electrical trade, I thought I\'d seen it all. Maintenance Mentor proved me wrong. The video library alone is worth the subscription - detailed tutorials for complex repairs save me time on every job. The AI photo analyzer has caught safety issues I might have missed.',
    date: '2024-08-05'
  },
  {
    id: 6,
    name: 'Samantha Brooks',
    role: 'Pool Service Manager',
    company: 'Crystal Clear Pools',
    industry: 'Pool Service',
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759599119382_45fcc395.webp',
    rating: 5,
    content: 'Managing seasonal pool maintenance for 150+ clients was chaotic before Maintenance Mentor. Now everything is organized - chemical logs, equipment repairs, customer preferences. The mobile app works perfectly in the field, and clients love receiving detailed service reports with photos.',
    date: '2024-09-10'
  },
  {
    id: 7,
    name: 'James Mitchell',
    role: 'Maintenance Supervisor',
    company: 'Greenfield Apartments',
    industry: 'Property Management',
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759599120124_4ddf9dfe.webp',
    rating: 5,
    content: 'Coordinating a team of 8 technicians across multiple properties was a nightmare. Maintenance Mentor transformed our workflow. Real-time updates, work order tracking, and performance analytics keep everyone accountable. Tenant satisfaction has never been higher, and our team efficiency improved 45%.',
    date: '2024-08-28'
  },
  {
    id: 8,
    name: 'Lisa Anderson',
    role: 'Owner & CEO',
    company: 'Anderson HVAC Group',
    industry: 'HVAC',
    image: 'https://d64gsuwffb70l.cloudfront.net/68c9923ef8d4133261c0613a_1759599120848_7128c506.webp',
    rating: 5,
    content: 'Growing from 3 to 15 technicians, we needed enterprise-level tools without enterprise prices. Maintenance Mentor scales beautifully. The subscription analytics help us forecast revenue, the parts tracker prevents overstocking, and the training videos onboard new hires faster. Best business decision we\'ve made.',
    date: '2024-07-25'
  }
];

const industries = ['All', 'HVAC', 'Plumbing', 'Property Management', 'Facilities', 'Electrical', 'Pool Service'];

const Testimonials = () => {
  const [selectedIndustry, setSelectedIndustry] = useState('All');

  const filteredTestimonials = useMemo(() => {
    if (selectedIndustry === 'All') return defaultTestimonials;
    return defaultTestimonials.filter(t => t.industry === selectedIndustry);
  }, [selectedIndustry]);


  const averageRating = useMemo(() => {
    const sum = filteredTestimonials.reduce((acc, t) => acc + t.rating, 0);
    return (sum / filteredTestimonials.length).toFixed(1);
  }, [filteredTestimonials]);

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Trusted by Maintenance Professionals
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Join thousands of property managers and technicians who save time and money with Maintenance Mentor.
          </p>
          
          {/* Metrics */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl px-6 py-4 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-orange-500 fill-current" />
                <span className="text-3xl font-bold text-orange-500">{averageRating}</span>
              </div>
              <p className="text-sm text-gray-400">Average Rating</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl px-6 py-4 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span className="text-3xl font-bold text-orange-500">{filteredTestimonials.length}</span>
              </div>
              <p className="text-sm text-gray-400">Total Reviews</p>
            </div>
          </div>
        </div>

        {/* Industry Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Filter className="w-5 h-5 text-gray-400 self-center" />
          {industries.map((industry) => (
            <Button
              key={industry}
              onClick={() => setSelectedIndustry(industry)}
              variant={selectedIndustry === industry ? 'default' : 'outline'}
              className={`rounded-full transition-all duration-300 ${
                selectedIndustry === industry
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
              }`}
            >
              {industry}
            </Button>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTestimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 relative hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-2 border border-gray-700/50 group"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-orange-500 opacity-30 group-hover:opacity-50 transition-opacity" />
              
              {/* Customer Info */}
              <div className="flex items-start mb-6">
                <img 
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover mr-4 ring-2 ring-orange-500/50 group-hover:ring-orange-500 transition-all"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-white">{testimonial.name}</h4>
                  <p className="text-orange-400 text-sm font-medium">{testimonial.role}</p>
                  <p className="text-gray-400 text-xs">{testimonial.company}</p>
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-orange-500 fill-current" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-gray-300 leading-relaxed mb-4">{testimonial.content}</p>
              
              {/* Industry Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-block bg-orange-500/20 text-orange-400 text-xs px-3 py-1 rounded-full border border-orange-500/30">
                  {testimonial.industry}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(testimonial.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-gray-300 mb-6 text-lg">
            Ready to join these successful professionals?
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg rounded-full shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
