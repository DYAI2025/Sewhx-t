import React, { useState, useEffect } from 'react';
import Stepper from './components/Stepper';
import ImportStep from './components/ImportStep';
import TimestampMappingStep from './components/TimestampMappingStep';
import MergePreviewStep from './components/MergePreviewStep';
import AnalysisConfigStep from './components/AnalysisConfigStep';
import AnalysisDashboardStep from './components/AnalysisDashboardStep';
import ExportStep from './components/ExportStep';

import {
  ChatMessage,
  AudioFileItem,
  MergedChatDocument,
  AnalysisConfig,
  AnalysisResult,
  MarkerCategory,
} from './types';
import { runAnalysis } from './lib/mockServices';

const defaultCategories: MarkerCategory[] = [
  { id: 'mc-coop', label: 'Kooperation', keywords: ['gemeinsam', 'zusammen', 'helfen', 'unterstützen', 'kooperation', 'einig'], colorToken: '#00cfcc' },
  { id: 'mc-empathy', label: 'Empathie & Resonanz', keywords: ['fühlen', 'empathie', 'verstehen', 'resonanz', 'gefühl', 'nah'], colorToken: '#eab308' },
  { id: 'mc-conflict', label: 'Konflikt & Abgrenzung', keywords: ['grenze', 'nein', 'widerstand', 'blockiert', 'konflikt', 'schwer'], colorToken: '#f43f5e' },
];

export default function App() {
  // App states
  const [currentStep, setCurrentStep] = useState(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);
  
  const [chatFile, setChatFile] = useState<{ name: string; content: string } | null>(null);
  const [audioItems, setAudioItems] = useState<AudioFileItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mergedDocument, setMergedDocument] = useState<MergedChatDocument | null>(null);
  
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    mode: 'relationship_analysis',
    topicFocus: 'Teamdynamik & Kollaboration',
    markerCategories: defaultCategories,
    depth: 'balanced',
    includeEvidenceQuotes: true,
    compareSpeakers: true,
    detectTippingPoints: true,
    generateHeatmap: true,
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Auto unlock logic based on filled values
  useEffect(() => {
    let targetUnlocked = 1;
    
    // Step 2 unlocked if chat file and some valid audio documents are present
    if (chatFile !== null && audioItems.length > 0) {
      targetUnlocked = 2;
    }

    // Step 3 unlocked if map step is traversed or audio state is prepared
    if (chatFile !== null && audioItems.length > 0 && audioItems.every(a => a.status === 'ready' || a.status === 'transcripts' || a.status === 'transcribed')) {
      targetUnlocked = 3;
    }

    // Step 4 unlocked if merge document completed
    if (mergedDocument !== null) {
      targetUnlocked = 4;
    }

    // Step 5 unlocked if analysis results generated
    if (analysisResult !== null) {
      targetUnlocked = 5;
    }

    // Step 6 unlocked once analysis results are generated
    if (analysisResult !== null) {
      targetUnlocked = 6;
    }

    setMaxUnlockedStep(prev => Math.max(prev, targetUnlocked));
  }, [chatFile, audioItems, mergedDocument, analysisResult]);

  // Action flow helpers
  const handleNext = () => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setMaxUnlockedStep(prev => Math.max(prev, nextStep));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleStepSelect = (step: number) => {
    if (step <= maxUnlockedStep) {
      setCurrentStep(step);
    }
  };

  // Perform mock evaluation
  const handlePerformAnalysis = () => {
    if (!mergedDocument) return;
    setIsProcessing(true);
    setGlobalError(null);

    // Simulate 1.5s psychodynamic computational mapping
    setTimeout(() => {
      try {
        const result = runAnalysis(mergedDocument, analysisConfig);
        setAnalysisResult(result);
        setIsProcessing(false);
        setCurrentStep(5); // Go directly to Dashboard
        setMaxUnlockedStep(prev => Math.max(prev, 5));
      } catch (err: any) {
        setGlobalError("Fehler bei der Syntheseberechnung. Bitte wähle eine andere Marker-Kombination.");
        setIsProcessing(false);
      }
    }, 1500);
  };

  // Full app workflow reset
  const handleResetWorkflow = () => {
    setCurrentStep(1);
    setMaxUnlockedStep(1);
    setChatFile(null);
    setAudioItems([]);
    setChatMessages([]);
    setMergedDocument(null);
    setAnalysisResult(null);
    setGlobalError(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text-primary)] font-sans antialiased p-4 md:p-8 selection:bg-[var(--color-primary)]/20">
      
      {/* Title block */}
      <h1 className="text-3xl font-black text-center text-[var(--color-text-primary)] mb-10 tracking-tight flex items-center justify-center space-x-2">
        <span className="bg-gradient-to-r from-[var(--color-primary)] to-cyan-500 bg-clip-text text-transparent">
          WordThread
        </span>
        <span className="font-light text-gray-400">| Omni-Analyzer</span>
      </h1>

      {/* Stepper with click-to-nav locked parameters */}
      <Stepper 
        currentStep={currentStep} 
        maxUnlockedStep={maxUnlockedStep} 
        onStepChange={handleStepSelect} 
      />
      
      {globalError && (
        <div className="max-w-5xl mx-auto mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-2xl flex justify-between">
          <span>{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="font-black hover:opacity-70">×</button>
        </div>
      )}

      {/* Primary Workspace */}
      <main className="max-w-5xl mx-auto mt-6 bg-white/40 p-1 rounded-[40px] shadow-sm">
        {currentStep === 1 && (
          <ImportStep 
            chatFile={chatFile}
            audioItems={audioItems}
            setChatFile={setChatFile}
            setAudioItems={setAudioItems}
            setChatMessages={setChatMessages}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <TimestampMappingStep 
            audioItems={audioItems}
            chatMessages={chatMessages}
            setAudioItems={setAudioItems}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}

        {currentStep === 3 && (
          <MergePreviewStep 
            audioItems={audioItems}
            chatMessages={chatMessages}
            setAudioItems={setAudioItems}
            mergedDocument={mergedDocument}
            setMergedDocument={setMergedDocument}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}

        {currentStep === 4 && (
          <div className="relative">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 rounded-[40px] z-50 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-[var(--color-primary)] animate-spin" />
                <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Berechne psychodynamisches Modell...</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Prüfe Wortfelder, kognitive Aktivierung und Kipppunkte...</p>
              </div>
            )}
            <AnalysisConfigStep 
              config={analysisConfig}
              setConfig={setAnalysisConfig}
              onPrev={handlePrev}
              onNext={handlePerformAnalysis}
            />
          </div>
        )}

        {currentStep === 5 && analysisResult && (
          <AnalysisDashboardStep 
            mergedDocument={mergedDocument!}
            analysisResult={analysisResult}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}

        {currentStep === 6 && analysisResult && (
          <ExportStep 
            mergedDocument={mergedDocument!}
            analysisResult={analysisResult}
            onPrev={handlePrev}
            onReset={handleResetWorkflow}
          />
        )}
      </main>
      
      {/* Small design footer */}
      <footer className="max-w-5xl mx-auto mt-16 text-center text-[10px] uppercase font-black tracking-widest text-[var(--color-text-secondary)] opacity-40">
        WordThread Omni-Analyzer • Powered by deep-semantic micro-syntheses
      </footer>
    </div>
  );
}
