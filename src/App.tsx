import React, { useState, useEffect } from 'react';
import Stepper from './components/Stepper';
import ImportPackageStep from './components/ImportPackageStep';
import ImportReviewStep from './components/ImportReviewStep';
import TranscriptionStep from './components/TranscriptionStep';
import MergePreviewStep from './components/MergePreviewStep';
import AnalysisChoiceStep from './components/AnalysisChoiceStep';
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

const defaultCategories: MarkerCategory[] = [
  { id: 'mc-coop', label: 'Kooperation', keywords: ['gemeinsam', 'zusammen', 'helfen', 'unterstützen', 'kooperation', 'einig'], colorToken: '#00cfcc' },
  { id: 'mc-empathy', label: 'Empathie & Resonanz', keywords: ['fühlen', 'empathie', 'verstehen', 'resonanz', 'gefühl', 'nah'], colorToken: '#eab308' },
  { id: 'mc-conflict', label: 'Konflikt & Abgrenzung', keywords: ['grenze', 'nein', 'widerstand', 'blockiert', 'konflikt', 'schwer'], colorToken: '#f43f5e' },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);
  
  const [sessionId, setSessionId] = useState("");
  const [classifiedManifest, setClassifiedManifest] = useState<any[]>([]);
  const [chatFile, setChatFile] = useState<{ name: string; content: string } | null>(null);
  const [audioItems, setAudioItems] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mergedDocument, setMergedDocument] = useState<MergedChatDocument | null>(null);
  
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    mode: 'semiotic_analysis',
    topicFocus: 'Beziehungsdynamiken & Supervision',
    markerCategories: defaultCategories,
    depth: 'balanced',
    includeEvidenceQuotes: true,
    compareSpeakers: true,
    detectTippingPoints: true,
    generateHeatmap: true,
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Hook chat messages state when chatFile is loaded
  useEffect(() => {
    if (chatFile) {
      // Fast parsing helper on client state to prepare items
      const lines = chatFile.content.split('\n');
      const messages: ChatMessage[] = [];
      
      lines.forEach((line, idx) => {
        // match date pattern i.e. [29.06.25, 13:02:00] Zoe: Hey Ben!
        const match = line.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.*)$/);
        if (match) {
          messages.push({
            id: `msg-${idx}-${Date.now()}`,
            timestamp: new Date().toISOString(), // stub correctly sorted
            sender: match[2].trim(),
            text: match[3].trim(),
            type: "text",
            source: { kind: "whatsapp_export", fileName: chatFile.name }
          });
        }
      });
      setChatMessages(messages);
    }
  }, [chatFile]);

  // Unlocking parameters
  useEffect(() => {
    let unlocked = 1;
    if (chatFile) {
      unlocked = 2; // Can review manifest
    }
    if (chatFile && audioItems.length > 0) {
      unlocked = 3; // Can transcribe
    }
    const transCompleted = audioItems.length > 0 && audioItems.every(i => i.status === "transcribed");
    if (chatFile && transCompleted) {
      unlocked = 4; // Can preview merge
    }
    if (mergedDocument) {
      unlocked = 5; // Can select analysis
    }
    if (analysisResult) {
      unlocked = 6; // Can view report
    }
    if (analysisResult && currentStep >= 6) {
      unlocked = 7; // Final Export
    }
    setMaxUnlockedStep(prev => Math.max(prev, unlocked));
  }, [chatFile, audioItems, mergedDocument, analysisResult, currentStep]);

  const handleNext = () => {
    const next = currentStep + 1;
    setCurrentStep(next);
    setMaxUnlockedStep(prev => Math.max(prev, next));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleStepSelect = (step: number) => {
    if (step <= maxUnlockedStep) {
      setCurrentStep(step);
    }
  };

  const handleResetWorkflow = () => {
    setCurrentStep(1);
    setMaxUnlockedStep(1);
    setSessionId("");
    setClassifiedManifest([]);
    setChatFile(null);
    setAudioItems([]);
    setChatMessages([]);
    setMergedDocument(null);
    setAnalysisResult(null);
    setGlobalError(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text-primary)] font-sans antialiased p-4 md:p-8 selection:bg-[var(--color-primary)]/20">
      
      {/* Brand Title */}
      <h1 className="text-3xl font-black text-center text-[var(--color-text-primary)] mb-10 tracking-tight flex items-center justify-center space-x-2">
        <span className="bg-gradient-to-r from-[var(--color-primary)] to-cyan-500 bg-clip-text text-transparent">
          WordThread
        </span>
        <span className="font-light text-gray-400">| Omni-Analyzer</span>
      </h1>

      {/* 7-Step Stepper Component */}
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

      {/* Active Workspace */}
      <main className="max-w-5xl mx-auto mt-6 bg-white/40 p-1 rounded-[40px] shadow-sm">
        {currentStep === 1 && (
          <ImportPackageStep 
            chatFile={chatFile}
            audioItems={audioItems}
            setChatFile={setChatFile}
            setAudioItems={setAudioItems}
            setChatMessages={setChatMessages}
            onNext={handleNext}
            setSessionId={setSessionId}
            setClassifiedManifest={setClassifiedManifest}
          />
        )}

        {currentStep === 2 && (
          <ImportReviewStep 
            classifiedManifest={classifiedManifest}
            audioItems={audioItems}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}

        {currentStep === 3 && (
          <TranscriptionStep 
            sessionId={sessionId}
            audioItems={audioItems}
            setAudioItems={setAudioItems}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}

        {currentStep === 4 && (
          <MergePreviewStep 
            sessionId={sessionId}
            audioItems={audioItems}
            chatMessages={chatMessages}
            mergedDocument={mergedDocument}
            setMergedDocument={setMergedDocument}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}

        {currentStep === 5 && (
          <AnalysisChoiceStep 
            mergedDocument={mergedDocument}
            config={analysisConfig}
            setConfig={setAnalysisConfig}
            setAnalysisResult={setAnalysisResult}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}

        {currentStep === 6 && analysisResult && (
          <AnalysisDashboardStep 
            mergedDocument={mergedDocument!}
            analysisResult={analysisResult}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}

        {currentStep === 7 && analysisResult && (
          <ExportStep 
            mergedDocument={mergedDocument!}
            analysisResult={analysisResult}
            onPrev={handlePrev}
            onReset={handleResetWorkflow}
          />
        )}
      </main>
      
      <footer className="max-w-5xl mx-auto mt-16 text-center text-[10px] uppercase font-black tracking-widest text-[var(--color-text-secondary)] opacity-40">
        WordThread Omni-Analyzer • Powered by deep-semantic semiotic-marker-sense
      </footer>
    </div>
  );
}
