import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { HarvestDetailsStep } from './workflow/HarvestDetailsStep';
import { HarvestGradingStep } from './workflow/HarvestGradingStep';
import { HarvestReviewStep } from './workflow/HarvestReviewStep';
import { HarvestCompletionStep } from './workflow/HarvestCompletionStep';
import { HarvestEvent, HarvestGrading, HarvestCosts } from '../../types';

interface StartHarvestWorkflowProps {
  farmId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const StartHarvestWorkflow: React.FC<StartHarvestWorkflowProps> = ({
  farmId,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [harvestData, setHarvestData] = useState<Partial<HarvestEvent>>({
    farmId,
    status: 'DRAFT'
  });
  const [gradings, setGradings] = useState<HarvestGrading[]>([]);

  const steps = [
    { number: 1, label: 'Details', icon: '📝' },
    { number: 2, label: 'Grade', icon: '⚖️' },
    { number: 3, label: 'Review', icon: '👁️' },
    { number: 4, label: 'Complete', icon: '✅' }
  ];

  const handleDetailsComplete = (data: Partial<HarvestEvent>) => {
    setHarvestData({ ...harvestData, ...data });
    setCurrentStep(2);
  };

  const handleGradingComplete = (gradingData: HarvestGrading[]) => {
    setGradings(gradingData);
    setCurrentStep(3);
  };

  const handleReviewComplete = (costs: HarvestCosts) => {
    setHarvestData({ 
      ...harvestData, 
      costs,
      status: 'COMPLETED'
    });
    setCurrentStep(4);
  };

  const handleFinalComplete = () => {
    // في التطبيق الحقيقي، نحفظ البيانات في context/database
    console.log('Harvest completed:', { harvestData, gradings });
    onComplete();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    // حفظ المسودة
    console.log('Draft saved:', { harvestData, gradings });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                      transition-all duration-300
                      ${currentStep >= step.number 
                        ? 'bg-[#0A4D68] text-white' 
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {step.icon}
                  </div>
                  <span className={`text-sm font-medium ${currentStep >= step.number ? 'text-[#0A4D68]' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`
                      flex-1 h-1 mx-4 rounded transition-all duration-300
                      ${currentStep > step.number ? 'bg-[#0A4D68]' : 'bg-gray-200'}
                    `}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <HarvestDetailsStep
          farmId={farmId}
          initialData={harvestData}
          onNext={handleDetailsComplete}
          onCancel={onCancel}
        />
      )}

      {currentStep === 2 && (
        <HarvestGradingStep
          harvestData={harvestData}
          initialGradings={gradings}
          onNext={handleGradingComplete}
          onBack={handleBack}
          onSaveDraft={handleSaveDraft}
        />
      )}

      {currentStep === 3 && (
        <HarvestReviewStep
          harvestData={harvestData}
          gradings={gradings}
          onNext={handleReviewComplete}
          onBack={handleBack}
        />
      )}

      {currentStep === 4 && (
        <HarvestCompletionStep
          harvestData={harvestData}
          gradings={gradings}
          onComplete={handleFinalComplete}
        />
      )}
    </div>
  );
};
