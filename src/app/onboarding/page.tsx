'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { PlatformSelection } from '@/components/onboarding/PlatformSelection';
import { NicheSelection } from '@/components/onboarding/NicheSelection';
import { GoalSetting } from '@/components/onboarding/GoalSetting';
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Compass } from 'lucide-react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    currentOnboardingStep, 
    setCurrentOnboardingStep,
    selectedPlatform,
    selectedNiche,
    setOnboardingComplete
  } = useAppStore();

  const [step, setStep] = useState(currentOnboardingStep);

  // Check for platform parameter from landing page
  useEffect(() => {
    const platformParam = searchParams.get('platform');
    if (platformParam && step === 0) {
      // If platform is specified, we can skip to niche selection
      setStep(1);
      setCurrentOnboardingStep(1);
    }
  }, [searchParams, step, setCurrentOnboardingStep]);

  const steps = [
    { id: 0, title: 'Choose Platform', component: PlatformSelection },
    { id: 1, title: 'Select Niche', component: NicheSelection },
    { id: 2, title: 'Set Goals', component: GoalSetting },
    { id: 3, title: 'Complete', component: OnboardingComplete }
  ];

  const currentStepData = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const handleNext = () => {
    if (step < steps.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setCurrentOnboardingStep(nextStep);
      
      // If we're on the final step, mark onboarding as complete
      if (nextStep === steps.length - 1) {
        setOnboardingComplete(true);
      }
    } else {
      // Onboarding complete, redirect to dashboard
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      setCurrentOnboardingStep(prevStep);
    } else {
      router.push('/');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!selectedPlatform;
      case 1:
        return !!selectedNiche;
      case 2:
        return true; // Goals are optional
      case 3:
        return true;
      default:
        return false;
    }
  };

  const CurrentComponent = currentStepData.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <Compass className="h-6 w-6 text-purple-500" />
                <span className="text-xl font-bold">Creators AI Compass</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Step {step + 1} of {steps.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step Component */}
          <div className="mb-8">
            <CurrentComponent onNext={handleNext} />
          </div>

          {/* Navigation */}
          {step < steps.length - 1 && (
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              
              <Button onClick={handleNext} disabled={!canProceed()}>
                {step === steps.length - 2 ? 'Complete Setup' : 'Continue'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Compass className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading onboarding...</p>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}