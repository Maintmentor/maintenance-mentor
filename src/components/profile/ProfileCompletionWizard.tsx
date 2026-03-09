import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';
import { PersonalInfoStep } from './wizard-steps/PersonalInfoStep';
import { PropertyDetailsStep } from './wizard-steps/PropertyDetailsStep';
import { PreferencesStep } from './wizard-steps/PreferencesStep';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ProfileCompletionWizardProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function ProfileCompletionWizard({ userId, onComplete, onSkip }: ProfileCompletionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const totalSteps = 3;

  const updateFormData = (data: any) => {
    setFormData({ ...formData, ...data });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Profile completed!',
        description: 'Your profile has been successfully updated.',
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await supabase
        .from('profiles')
        .update({ profile_completion_skipped: true })
        .eq('id', userId);
      onSkip();
    } catch (error) {
      onSkip();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Step {currentStep} of {totalSteps}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="mt-4" />
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <PersonalInfoStep data={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 2 && (
            <PropertyDetailsStep data={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 3 && (
            <PreferencesStep data={formData} onUpdate={updateFormData} />
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
              <Button onClick={handleNext} disabled={loading}>
                {currentStep === totalSteps ? 'Complete' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
