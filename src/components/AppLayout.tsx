import React from 'react';
import Navigation from './Navigation';
import Hero from './Hero';
import StatsSection from './StatsSection';
import Features from './Features';
import HowItWorks from './HowItWorks';
import Pricing from './Pricing';
import Testimonials from './Testimonials';
import Footer from './Footer';
import TrialBanner from './TrialBanner';
import FloatingChatButton from './FloatingChatButton';
import EnvValidationBanner from './setup/EnvValidationBanner';
import { AutoDeploymentBanner } from './setup/AutoDeploymentBanner';
import APIKeyStatusBanner from './setup/APIKeyStatusBanner';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <EnvValidationBanner />
      <AutoDeploymentBanner />
      <APIKeyStatusBanner />
      <Navigation />
      <TrialBanner />

      <Hero />
      <StatsSection />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <Footer />
      <FloatingChatButton />
    </div>
  );
}
