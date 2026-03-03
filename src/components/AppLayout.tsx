import React from 'react';
import Navigation from './Navigation';
import Hero from './Hero';
import Features from './Features';
import Pricing from './Pricing';
import Testimonials from './Testimonials';
import Footer from './Footer';
import TrialBanner from './TrialBanner';
import FloatingChatButton from './FloatingChatButton';
import EnvValidationBanner from './setup/EnvValidationBanner';
import { AutoDeploymentBanner } from './setup/AutoDeploymentBanner';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <EnvValidationBanner />
      <AutoDeploymentBanner />
      <Navigation />
      <TrialBanner />

      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <Footer />
      <FloatingChatButton />
    </div>
  );
}

