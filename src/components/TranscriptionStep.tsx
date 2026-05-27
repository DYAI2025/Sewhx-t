import React, { useState, useEffect } from 'react';
import { ChevronRight, AudioLines, RefreshCw, MessageSquareQuote, Check, AlertCircle, Play } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import StatusPill from './ui/StatusPill';
import { apiClient } from '../lib/apiClient';

type TranscriptionStepProps = {
  sessionId: string;
  audioItems: any[];
  setAudioItems: (items: any[]) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function TranscriptionStep({
  sessionId,
  audioItems,
  setAudioItems,
  onPrev,
  onNext
}: TranscriptionStepProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionLogs, setTranscriptionLogs] = useState<string[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  const triggerJobs = async () => {
    setIsTranscribing(true);
    setTranscriptionLogs(["Starte asynchronen Transkriptions-Job...", "Verbinde mit Whisper-Service-Adapter..."]);
    
    // 1. Trigger call in ApiClient
    await apiClient.triggerTranscription(sessionId);

    // Initial state setup to "transcribing" for items that have queued status
    const initialMapped = audioItems.map(item => ({
      ...item,
      status: "transcribing",
      progress: 5
    }));
    setAudioItems(initialMapped);
  };

  useEffect(() => {
    if (!isTranscribing) return;

    const timer = setInterval(async () => {
      // Fetch statuses
      const statusRes = await apiClient.getTranscriptionStatus(sessionId, audioItems);
      
      const updatedItems = audioItems.map(item => {
        const found = statusRes.statuses.find((s: any) => s.file_id === item.id);
        if (found) {
          // Add custom simulated progress
          let currentProg = item.progress || 10;
          if (currentProg < 100) {
            currentProg += Math.floor(Math.random() * 25) + 15;
            if (currentProg >= 100) currentProg = 100;
          }
          
          return {
            ...item,
            status: currentProg >= 100 ? "transcribed" : "transcribing",
            progress: currentProg,
            transcript: currentProg >= 100 ? found.transcript : undefined
          };
        }
        return item;
      });

      setAudioItems(updatedItems);

      const allDone = updatedItems.every(item => (item.progress || 0) >= 100);
      if (allDone) {
        setIsTranscribing(false);
        setTranscriptionLogs(prev => [...prev, "Transkription aller Audiopakete erfolgreich beendet.", "Sprecherzuordnungen optimiert."]);
        clearInterval(timer);
      } else {
        setTranscriptionLogs(prev => [
          ...prev, 
          `Schreibe Datenfaden fort... ${updatedItems.filter(i => (i.progress || 0) >= 100).length}/${updatedItems.length} transkribiert.`
        ].slice(-4));
      }
    }, 1200);

    return () => clearInterval(timer);
  }, [isTranscribing, audioItems, sessionId]);

  const allCompleted = audioItems.length > 0 && audioItems.every(item => item.status === "transcribed");

  return (
    <div className="space-y-8 animate-fadeIn" id="transcription-step-container">
      {/* Structural Headers */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 border border-gray-100 rounded-2xl p-6">
        <div>
          <h3 className="text-lg font-black text-[var(--color-text-primary)]">Audio-Transkription &amp; Sprechmuster-Wandlung</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Erzeugt aus gesprochenen Wortnachrichten präzisen, chronologischen Fließtext.</p>
        </div>
        {!allCompleted && !isTranscribing && (
          <SoftButton onClick={triggerJobs} className="mt-4 md:mt-0 shadow-sm flex items-center">
            <RefreshCw size={15} className="mr-1.5 animate-spin-slow" /> Transkription starten
          </SoftButton>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Audios & progress tracking */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Aufnahmen-Liste</h4>
          
          <div className="space-y-3">
            {audioItems.map((item) => {
              const progValue = item.progress || 0;
              const isDone = item.status === "transcribed" || progValue >= 100;
              const isWorking = item.status === "transcribing";
              
              return (
                <div 
                  key={item.id}
                  className={`border rounded-2xl p-5 transition-all duration-300 bg-white ${
                    isDone 
                      ? "border-emerald-100 shadow-sm" 
                      : isWorking 
                        ? "border-[var(--color-primary)]/40 ring-2 ring-[var(--color-primary)]/5" 
                        : "border-slate-100"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${isDone ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-slate-500"}`}>
                        <AudioLines size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[var(--color-text-primary)] block truncate max-w-xs md:max-w-md">
                          {item.fileName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Format: {item.format.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isDone && (
                        <button 
                          onClick={() => setActivePreviewId(activePreviewId === item.id ? null : item.id)}
                          className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 pr-3 pl-3"
                        >
                          {activePreviewId === item.id ? "Ausblenden" : "Vorschau Text"}
                        </button>
                      )}
                      <StatusPill status={item.status} />
                    </div>
                  </div>

                  {/* Progress bar container */}
                  {(isWorking || (progValue > 0 && progValue < 100)) && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-[var(--color-text-secondary)]">
                        <span>Lade Sprachdaten in Modell...</span>
                        <span>{progValue}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[var(--color-primary)] to-cyan-500 rounded-full transition-all duration-300" 
                          style={{ width: `${progValue}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Preview Text box */}
                  {isDone && activePreviewId === item.id && item.transcript && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-750 italic leading-relaxed relative selection:bg-cyan-500">
                      <MessageSquareQuote size={16} className="text-[var(--color-primary)] mb-1" />
                      "{item.transcript}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: console/process outputs */}
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Verarbeitungslog</h4>
          
          <div className="bg-slate-900 rounded-3xl p-6 font-mono text-[10.5px] text-zinc-100 space-y-3 shadow-inner min-h-[160px]">
            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="font-bold uppercase tracking-wider">Console-Logger</span>
            </div>
            {transcriptionLogs.length === 0 ? (
              <p className="text-zinc-500 italic">Warte auf Berechnungsstart...</p>
            ) : (
              transcriptionLogs.map((log, idx) => (
                <p key={idx} className="leading-relaxed border-l border-zinc-700 pl-2">
                  &gt; {log}
                </p>
              ))
            )}
          </div>

          {allCompleted && (
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-start space-x-3">
              <div className="p-1 bg-emerald-100 text-emerald-700 rounded-full mt-0.5">
                <Check size={14} />
              </div>
              <div>
                <span className="font-bold text-xs text-emerald-900 block">Abschluss geglückt</span>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  Alle Sprachnachrichten liegen als Textübertragungen bereit und können chronologisch gemerged werden.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav Actions */}
      <div className="flex justify-between items-center pt-4">
        <SoftButton variant="secondary" onClick={onPrev}>
          Zurück zur Überprüfung
        </SoftButton>
        <SoftButton 
          disabled={!allCompleted}
          onClick={onNext}
          className="shadow-md flex items-center"
        >
          Gemeinsamer Merge &amp; Export <ChevronRight size={16} className="ml-1" />
        </SoftButton>
      </div>
    </div>
  );
}
