/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Stepper from './components/Stepper';
import ImportStep from './components/ImportStep';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-10">WordThread Omni-Analyzer</h1>
      <Stepper currentStep={currentStep} />
      
      <main className="max-w-5xl mx-auto mt-12">
        {currentStep === 1 && <ImportStep />}
      </main>
    </div>
  );
}
