import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Send, CheckCircle } from 'lucide-react';

import { SSLStatus } from './security/SSLStatus';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setSubscribing(true);
    // Simulate newsletter subscription
    setTimeout(() => {
      setSubscribed(true);
      setSubscribing(false);
      setEmail('');
    }, 1000);
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-1">Stay Updated</h3>
              <p className="text-gray-400">Get maintenance tips, product updates, and industry insights delivered to your inbox.</p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Thanks for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full md:w-72"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Wrench className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold">Maintenance Mentor</span>
            </div>
            <p className="text-gray-400 max-w-xs">
              Your AI-powered maintenance and repair mentor for service techs and property managers across the United States.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Youtube className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#features" onClick={(e) => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors">HVAC Repairs</a></li>
              <li><a href="#features" onClick={(e) => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors">Electrical Issues</a></li>
              <li><a href="#features" onClick={(e) => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors">Plumbing Solutions</a></li>
              <li><a href="#features" onClick={(e) => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors">Appliance Fixes</a></li>
              <li><Link to="/video-library" className="hover:text-white transition-colors">Video Tutorials</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/knowledge-base" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/video-library" className="hover:text-white transition-colors">Video Library</Link></li>
              <li><a href="#pricing" onClick={(e) => { e.preventDefault(); document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#testimonials" onClick={(e) => { e.preventDefault(); document.querySelector('#testimonials')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors">Reviews</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Info</h4>
            <div className="space-y-3 text-gray-400">
              <a href="mailto:info@maintenancementor.net" className="flex items-center space-x-3 hover:text-white transition-colors">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>info@maintenancementor.net</span>
              </a>
              <a href="tel:1-352-575-3472" className="flex items-center space-x-3 hover:text-white transition-colors">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>1-352-575-3472</span>
              </a>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>Gainesville, FL 32618</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Maintenance Mentor. All rights reserved.
            </p>
            <SSLStatus showDetails={true} />
          </div>
          <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
            <Link to="/contact" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
