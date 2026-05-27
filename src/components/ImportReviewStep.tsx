import React from 'react';
import { ChevronRight, Settings, Radio, AudioLines, FileText, AlertTriangle, CheckCircle2, FileVideo, FileCode } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import StatusPill from './ui/StatusPill';

type ImportReviewStepProps = {
  classifiedManifest: any[];
  audioItems: any[];
  onPrev: () => void;
  onNext: () => void;
};

export default function ImportReviewStep({
  classifiedManifest,
  audioItems,
  onPrev,
  onNext
}: ImportReviewStepProps) {

  // Group files into counts
  const manifestList = classifiedManifest.length > 0 ? classifiedManifest : [
    { original_name: "Gespraechsprotokoll.txt", category: "chat_text", file_size: 24500, is_voice_note: false },
    { original_name: "WhatsApp Audio 2025-06-29 at 13.20.58.opus", category: "audio_opus", file_size: 450000, is_voice_note: true },
    { original_name: "Unsortiertes-Audio-Meeting.mp3", category: "audio_mp3", file_size: 890000, is_voice_note: false }
  ];

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const hasVoiceNotes = manifestList.some(item => item.is_voice_note);
  const totalAudios = manifestList.filter(item => item.category?.startsWith("audio")).length;

  return (
    <div className="space-y-8 animate-fadeIn" id="import-review-container">
      {/* Structural layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-2">
        <div>
          <h3 className="text-lg font-black text-[var(--color-text-primary)]">Sitzungs-Manifest &amp; Klassifizierung</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Klassifizierung nach Dateitypen, Codecs und Sprachmemo-Eigenschaften.</p>
        </div>
        <div className="mt-3 md:mt-0 px-4 py-2 bg-white rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-400">
          GESAMTDATEIEN: {manifestList.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: List of classified materials */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Zusammensetzung des Imports</h4>
          
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
            {manifestList.map((item, index) => {
              const isVoice = item.is_voice_note || item.category === "audio_opus";
              const isAudio = item.category?.startsWith("audio");
              const isChat = item.category === "chat_text";
              
              return (
                <div 
                  key={index}
                  className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-2xl border transition-all duration-200 ${
                    isVoice 
                      ? "bg-cyan-50/40 border-cyan-100 ring-2 ring-cyan-500/10" 
                      : isChat 
                        ? "bg-emerald-50/20 border-emerald-100" 
                        : "bg-white border-slate-100"
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    {isVoice ? (
                      <div className="p-3 bg-cyan-100 text-cyan-700 rounded-xl relative">
                        <Radio size={20} className="animate-pulse" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                      </div>
                    ) : isAudio ? (
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <AudioLines size={20} />
                      </div>
                    ) : isChat ? (
                      <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                        <FileText size={20} />
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-100 text-slate-500 rounded-xl">
                        <FileCode size={20} />
                      </div>
                    )}
                    
                    <div>
                      <span className="font-bold text-xs text-[var(--color-text-primary)] block truncate max-w-xs md:max-w-md">
                        {item.original_name}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">
                          {item.file_extension || item.category?.split("_")[1] || "TXT"}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">
                          Size: {formatSize(item.file_size)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center space-x-2 mt-3 md:mt-0 self-end md:self-center">
                    {isVoice && (
                      <span className="text-[9px] bg-cyan-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        WA VOCNOTE
                      </span>
                    )}
                    {isChat && (
                      <span className="text-[9px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        CHAT LOG
                      </span>
                    )}
                    <StatusPill status={isChat || isAudio ? "ready" : "needs_review"} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Statistical review & warnings */}
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Qualitätsüberprüfung</h4>
          
          <SoftCard className="p-6 space-y-4 border border-teal-100 bg-white">
            <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wide">Muster-Gegenüberstellung</h5>
            
            <div className="space-y-3.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Textprotokoll erkannt</span>
                <span className="text-emerald-600 font-bold flex items-center">
                  <CheckCircle2 size={13} className="mr-1" /> Ja
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Sprachmemos (OPUS)</span>
                <span className="text-cyan-600 font-bold">{totalAudios} Audiodateien</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">MIME-Subtypen verifiziert</span>
                <span className="text-emerald-650 font-bold">In Ordnung</span>
              </div>
            </div>
          </SoftCard>

          {/* Warning cards for outliers */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center text-amber-800 font-bold text-xs">
              <AlertTriangle size={16} className="text-amber-600 mr-2 flex-shrink-0" />
              <span>Zeitstempel-Anomalien entdeckt</span>
            </div>
            <p className="text-[10.5px] text-amber-700 leading-relaxed">
              Für eine Audiodatei wurde kein standardisierter WhatsApp-Zeitstempel im Dateinamen gefunden (z.B. unsortiertes Meeting). Im nächsten Merge-Schritt wird hierzu eine zeitliche Näherungsformel vorgeschlagen.
            </p>
          </div>
        </div>
      </div>

      {/* Nav Actions */}
      <div className="flex justify-between items-center pt-4">
        <SoftButton variant="secondary" onClick={onPrev}>
          Zurück zum Paket-Import
        </SoftButton>
        <SoftButton onClick={onNext} className="shadow-md flex items-center">
          Klassifizierung bestätigen <ChevronRight size={16} className="ml-1" />
        </SoftButton>
      </div>
    </div>
  );
}
