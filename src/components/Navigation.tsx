import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Wrench, User, LogOut, Download, CreditCard, BarChart3, LayoutDashboard, Video, Shield, BookOpen, Film, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './auth/AuthModal';
import NotificationCenter from './notifications/NotificationCenter';
import { usePWA } from '@/hooks/usePWA';
import { usePermissions } from '@/hooks/usePermissions';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'signin' | 'signup'>('signin');
  const { user, profile, signOut } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const { isAdmin } = usePermissions();

  useEffect(() => {
    console.log('Navigation Component Loaded');
    console.log('User logged in:', !!user);
  }, [user, isAuthModalOpen]);

  const handleAuthClick = (view: 'signin' | 'signup') => {
    console.log('Opening auth modal:', view);
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    setIsMenuOpen(false);

    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.querySelector(hash);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.querySelector(hash);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Maintenance Mentor</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                Home
              </a>
              <a href="#features" onClick={(e) => handleNavClick(e, '#features')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                Features
              </a>
              <a href="#pricing" onClick={(e) => handleNavClick(e, '#pricing')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                Pricing
              </a>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                Contact
              </Link>

              {user ? (
                <div className="flex items-center space-x-3">
                  <NotificationCenter />

                  {/* Resources Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Resources <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate('/knowledge-base')}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Help Center
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/video-library')}>
                        <Video className="h-4 w-4 mr-2" />
                        Video Library
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/video-analysis')}>
                        <Film className="h-4 w-4 mr-2" />
                        Video Analysis
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="default" size="sm" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>

                  {/* User Menu Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-2" />
                        Account <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-2 py-1.5 text-sm text-gray-600">
                        {profile?.full_name || user.email}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/analytics')}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/billing')}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Billing
                      </DropdownMenuItem>
                      {isAdmin() && (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="h-4 w-4 mr-2" />
                          Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {isInstallable && (
                    <Button variant="outline" size="sm" onClick={installApp}>
                      <Download className="h-4 w-4 mr-2" />
                      Install App
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleAuthClick('signin')}>
                    Sign In
                  </Button>
                  <Button size="sm" onClick={() => handleAuthClick('signup')}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-4">
                <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  Home
                </a>
                <a href="#features" onClick={(e) => handleNavClick(e, '#features')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  Features
                </a>
                <a href="#pricing" onClick={(e) => handleNavClick(e, '#pricing')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  Pricing
                </a>
                <a href="#testimonials" onClick={(e) => handleNavClick(e, '#testimonials')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  Reviews
                </a>
                <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Contact
                </Link>

                {user && (
                  <>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => { navigate('/knowledge-base'); setIsMenuOpen(false); }}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Help Center
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => { navigate('/video-library'); setIsMenuOpen(false); }}>
                      <Video className="h-4 w-4 mr-2" />
                      Video Library
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => { navigate('/video-analysis'); setIsMenuOpen(false); }}>
                      <Film className="h-4 w-4 mr-2" />
                      Video Analysis
                    </Button>
                  </>
                )}

                {user ? (
                  <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      {profile?.full_name || user.email}
                    </span>
                    <Button variant="default" size="sm" className="w-full justify-start" onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate('/analytics')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate('/billing')}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Billing
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    {isAdmin() && (
                      <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate('/admin')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                    {isInstallable && (
                      <Button variant="outline" size="sm" onClick={installApp} className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Install App
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => handleAuthClick('signin')} className="w-full">
                      Sign In
                    </Button>
                    <Button onClick={() => handleAuthClick('signup')} className="w-full">
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultView={authModalView}
      />
    </>
  );
};

export default Navigation;
