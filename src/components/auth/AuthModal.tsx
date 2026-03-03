import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { PasswordResetForm } from './PasswordResetForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'signin' | 'signup';
}

type AuthView = 'signin' | 'signup' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultView = 'signin' 
}) => {
  const [currentView, setCurrentView] = useState<AuthView>(defaultView);

  const handleToggleForm = () => {
    setCurrentView(currentView === 'signin' ? 'signup' : 'signin');
  };

  const handleForgotPassword = () => {
    setCurrentView('reset');
  };

  const handleBackToSignIn = () => {
    setCurrentView('signin');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'signup':
        return <SignUpForm onToggleForm={handleToggleForm} onSuccess={onClose} />;
      case 'reset':
        return <PasswordResetForm onBack={handleBackToSignIn} />;
      default:
        return (
          <SignInForm 
            onToggleForm={handleToggleForm} 
            onForgotPassword={handleForgotPassword}
            onSuccess={onClose}
          />
        );
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 border-0">
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        {renderCurrentView()}
      </DialogContent>
    </Dialog>
  );
};