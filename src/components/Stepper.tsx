import React from 'react';
import { cn } from '../lib/utils';

type StepperProps = {
  currentStep: number;
  maxUnlockedStep: number;
  onStepChange: (step: number) => void;
};

export default function Stepper({ currentStep, maxUnlockedStep, onStepChange }: StepperProps) {
  const steps = [
    { name: 'Import', label: '1. Import' },
    { name: 'Zeitstempel', label: '2. Zeitstempel' },
    { name: 'Merge', label: '3. Merge Preview' },
    { name: 'Analyse', label: '4. Konfiguration' },
    { name: 'Dashboard', label: '5. Dashboard' },
    { name: 'Export', label: '6. Export' }
  ];
  
  return (
    <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-3 md:gap-4 max-w-5xl mx-auto px-4 py-6 bg-white rounded-[32px] clay-card border border-white/60 mb-10">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCurrent = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        const isUnlocked = stepNum <= maxUnlockedStep;
        
        return (
          <React.Fragment key={step.name}>
            <button
              onClick={() => isUnlocked && onStepChange(stepNum)}
              disabled={!isUnlocked}
              className={cn(
                "group flex items-center space-x-2.5 transition-all duration-300 rounded-xl px-3 py-2 text-left outline-none",
                isUnlocked ? "cursor-pointer hover:bg-gray-50" : "cursor-not-allowed opacity-40",
                isCurrent && "bg-[#e1fbfc] ring-1 ring-[#00cfcc]/30"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 shadow-sm",
                isCurrent && "bg-[var(--color-primary)] text-white",
                isCompleted && "bg-[#d1f8f7] text-[var(--color-primary)]",
                (!isCompleted && !isCurrent && isUnlocked) && "bg-gray-100 text-[var(--color-text-secondary)]",
                !isUnlocked && "bg-gray-50 text-gray-300"
              )}>
                {stepNum}
              </div>
              <div className="flex flex-col text-xs">
                <span className={cn(
                  "font-bold transition-colors duration-200",
                  isCurrent ? "text-[var(--color-primary)]" : "text-[var(--color-text-primary)]"
                )}>
                  {step.name}
                </span>
                <span className="text-[10px] text-[var(--color-text-secondary)]">
                  {step.label}
                </span>
              </div>
            </button>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "hidden md:block flex-1 h-[2px] rounded-full transition-colors duration-300",
                stepNum < maxUnlockedStep ? "bg-[var(--color-primary)]/40" : "bg-gray-100"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
