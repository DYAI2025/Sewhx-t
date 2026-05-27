import React, { useState, useEffect } from 'react';
import { AudioLines, FileText, Check, Download, AlertCircle, FileSpreadsheet, MessagesSquare, ChevronRight, HardDriveDownload } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import StatusPill from './ui/StatusPill';
import { apiClient } from '../lib/apiClient';

type MergePreviewStepProps = {
  sessionId: string;
  audioItems: any[];
  chatMessages: any[];
  mergedDocument: any;
  setMergedDocument: (doc: any) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function MergePreviewStep({
  sessionId,
  audioItems,
  chatMessages,
  mergedDocument,
  setMergedDocument,
  onPrev,
  onNext
}: MergePreviewStepProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"json" | "txt" | "markdown" | "html">("html");

  const buildMergedDocument = async () => {
    setIsMerging(true);
    try {
      const doc = await apiClient.mergeSessionAndCreateDoc(sessionId, chatMessages, audioItems);
      setMergedDocument(doc);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMerging(false);
    }
  };

  useEffect(() => {
    if (!mergedDocument && chatMessages.length > 0) {
      buildMergedDocument();
    }
  }, [sessionId, chatMessages, audioItems]);

  const handleDownloadRaw = async () => {
    if (!mergedDocument) return;
    try {
      const fileData = await apiClient.downloadRawMergedDoc(mergedDocument.id, mergedDocument, downloadFormat);
      
      // File Save Helper
      const blob = new Blob([fileData.content], { type: fileData.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileData.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      console.error("Downloader failed: ", e);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="merge-preview-container">
      {/* Informative Step Banner */}
      <div className="bg-sky-50 border border-sky-100 rounded-[32px] p-6 clay-card flex items-start space-x-4">
        <div className="p-2.5 bg-sky-105 rounded-xl text-sky-700">
          <HardDriveDownload size={22} />
        </div>
        <div>
          <h4 className="font-bold text-[var(--color-text-primary)] mb-1">Produkt-Prinzip: Eigenständiger Rohdaten-Export</h4>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Der rekonstruierte Original-Chat inklusive transkribierter Sprachnachrichten kann hier jederzeit als Rohprotokoll heruntergeladen werden. Eine psycholinguistische Segmentierung oder semiotische Analyse ist optional und kann als nachgelagerter Erkenntnisschritt durchgeführt werden.
          </p>
        </div>
      </div>

      {isMerging && (
        <div className="p-12 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto" />
          <p className="font-bold text-sm text-[var(--color-text-primary)]">Führe Zeitstrahl zusammen...</p>
        </div>
      )}

      {mergedDocument && !isMerging && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Conversational Thread with Source Tags */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center">
              <MessagesSquare className="mr-2 text-[var(--color-primary)]" size={16} />
              Reconstructed Conversation Thread
            </h3>

            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 bg-gray-50/40 p-6 rounded-[32px] border border-gray-100">
              {mergedDocument.messages.map((msg: any) => {
                const isAudio = msg.type === "audio_transcript";
                const isZoe = msg.sender.toLowerCase().includes("zoe");
                const sourceFileName = msg.source?.fileName || "Unknown File";
                
                return (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono px-2">
                      <span className="font-semibold">{msg.sender}</span>
                      <span>•</span>
                      <span>Source: <strong className="text-[var(--color-primary)]">{sourceFileName}</strong></span>
                    </div>

                    <div className={`p-4 rounded-3xl border transition-all duration-200 ${
                      isAudio 
                        ? "bg-cyan-50/50 border-cyan-100 ring-1 ring-cyan-200" 
                        : isZoe 
                          ? "bg-white border-slate-100 shadow-sm"
                          : "bg-slate-50 border-slate-100"
                    }`}>
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-100/40">
                        {isAudio ? (
                          <span className="text-[9px] bg-cyan-600 text-white font-bold px-1.5 py-0.5 rounded-full flex items-center">
                            <AudioLines size={10} className="mr-1" /> AUDIO
                          </span>
                        ) : (
                          <span className="text-[9px] bg-neutral-100 text-neutral-600 font-bold px-1.5 py-0.5 rounded-full flex items-center">
                            <FileText size={10} className="mr-1" /> TEXT
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-primary)] leading-relaxed italic pr-2">
                        "{msg.text}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Pre-Analysis Exporter Panel */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
            <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Rohdaten-Exporteur
            </h3>

            <SoftCard className="p-6 space-y-5">
              <div className="space-y-1.5">
                <span className="font-bold text-xs text-[var(--color-text-primary)] block">Inhalt rekonstruiert ({mergedDocument.messages.length} Sätze)</span>
                <p className="text-[10.5px] text-[var(--color-text-secondary)] leading-relaxed">
                  Lade den synchronisierten Original-Faden jetzt herunter, bevor du dich für eine hermeneutische Untersuchung entscheidest.
                </p>
              </div>

              {/* Format selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Export-Format</label>
                <select
                  value={downloadFormat}
                  onChange={(e: any) => setDownloadFormat(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 outline-none focus:border-[var(--color-primary)] cursor-pointer"
                >
                  <option value="html">HTML Report (Druckoptimiert)</option>
                  <option value="markdown">Markdown Struktur (.md)</option>
                  <option value="txt">Klassischer Text-Log (.txt)</option>
                  <option value="json">Maschinenlesbares JSON (.json)</option>
                </select>
              </div>

              <SoftButton onClick={handleDownloadRaw} className="w-full shadow-md flex items-center justify-center text-xs">
                <Download size={14} className="mr-1.5" /> Rekonstruierten Chat herunterladen
              </SoftButton>
              
              <div className="text-[9.5px] text-emerald-600 font-bold text-center">
                ✔ Vollständig offline-generierbar
              </div>
            </SoftCard>

            <div className="bg-amber-100/30 border border-amber-200/40 rounded-2xl p-4 text-[10px] text-amber-800 leading-relaxed">
              <strong>Optionaler Folgeschritt:</strong> Sie können direkt im Anschluss fortfahren, um den Datenfaden hermeneutisch nach Beziehungen zu bewerten.
            </div>
          </div>

        </div>
      )}

      {/* Nav Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <SoftButton variant="secondary" onClick={onPrev}>
          Zurück zur Transkription
        </SoftButton>
        <SoftButton onClick={onNext} className="shadow-md flex items-center">
          Optionale Analyse konfigurieren <ChevronRight size={16} className="ml-1" />
        </SoftButton>
      </div>
    </div>
  );
}
