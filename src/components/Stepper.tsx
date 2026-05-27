import React from 'react';
import { cn } from '../lib/utils'; // Assuming this utility is standard or I'll implement a simple one

export default function Stepper({ currentStep }: { currentStep: number }) {
  const steps = ['Import', 'Zuordnung', 'Merge', 'Analyse', 'Ergebnis', 'Export'];
  
  return (
    <div className="flex justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
            index + 1 === currentStep ? "bg-[var(--color-primary)] text-white" : 
            index + 1 < currentStep ? "bg-[#d1d1d1] text-white" : "bg-white text-[var(--color-text-secondary)] clay-card"
          )}>
            {index + 1}
          </div>
          <span className="ml-2 text-[var(--color-text-secondary)] font-medium">{step}</span>
          {index < steps.length - 1 && <div className="w-10 h-0.5 bg-[#d1d1d1] mx-2" />}
        </div>
      ))}
    </div>
  );
}
