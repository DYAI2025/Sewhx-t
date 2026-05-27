import React, { useState } from 'react';
import { Download, FileDown, Eye, CheckSquare, Square, FileImage, Sparkles, FolderDown, RefreshCw } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import { MergedChatDocument, AnalysisResult } from '../types';
import { apiClient } from '../lib/apiClient';

type ExportStepProps = {
  mergedDocument: any;
  analysisResult: any;
  onPrev: () => void;
  onReset: () => void;
};

export default function ExportStep({
  mergedDocument,
  analysisResult,
  onPrev,
  onReset,
}: ExportStepProps) {
  const [format, setFormat] = useState<'json' | 'pdf' | 'markdown' | 'txt' | 'html'>('html');
  
  // checklist components
  const [includeChat, setIncludeChat] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [includeTipping, setIncludeTipping] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const formats = [
    { key: 'html' as const, label: 'HTML Report (Druckoptimiert)', desc: 'Modernes ansprechendes Layout mit Soft-Neumorphism-Farbschema.' },
    { key: 'markdown' as const, label: 'Markdown (.md)', desc: 'Strukturierte Gliederung für Obsidian, Notion oder GitHub.' },
    { key: 'txt' as const, label: 'Klartext (.txt)', desc: 'Schlichtes ASCII-Protokoll zur textlichen Archivierung.' },
    { key: 'json' as const, label: 'Daten-JSON (.json)', desc: 'Vollständig maschinenlesbares Dokument mit allen Metadaten.' },
  ];

  const handleExportTrigger = async () => {
    setExporting(true);
    setExportComplete(false);

    try {
      // Trigger calls to backend
      const report = await apiClient.exportAnalysisReport(
        analysisResult.id || `result-local-${Date.now()}`,
        mergedDocument,
        analysisResult,
        format
      );

      // Browser Download Blob
      const blob = new Blob([report.content], { type: report.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportComplete(true);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="export-step-container">
      {/* Structural layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-2">
        <div>
          <h3 className="text-lg font-black text-[var(--color-text-primary)]">Bericht &amp; Exportkonfiguration</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Wähle dein bevorzugtes Zielformat und passe die Exportbestandteile individuell an.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left pane: format chooser */}
        <div className="lg:col-span-6 space-y-5">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Exportformat auswählen</h4>
          
          <div className="space-y-3">
            {formats.map((f) => {
              const selected = f.key === format;
              return (
                <div 
                  key={f.key}
                  onClick={() => {
                    setFormat(f.key);
                    setExportComplete(false);
                  }}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center space-x-3.5 bg-white ${
                    selected 
                      ? "border-[var(--color-primary)] bg-[#e6fcfc]/25 ring-2 ring-[var(--color-primary)]/5"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${selected ? "bg-cyan-50 text-[var(--color-primary)]" : "bg-slate-50 text-slate-500"}`}>
                    <FileDown size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[var(--color-text-primary)]">{f.label}</h5>
                    <p className="text-[10.5px] text-[var(--color-text-secondary)] leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right pane: Preview & Trigger */}
        <div className="lg:col-span-6 space-y-5">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center">
            <Eye size={14} className="mr-1.5" />
            Report-Inhaltsübersicht
          </h4>

          <SoftCard className="p-6 space-y-5">
            <div className="bg-slate-950 text-zinc-300 rounded-2xl p-4 font-mono text-[10px] leading-relaxed max-h-[160px] overflow-y-auto">
              <div>=== REPORT METADATA ===</div>
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>Inclusions:</div>
              <div>- Chatlog: {includeChat ? "YES" : "NO"}</div>
              <div>- Semiotic Profiling: {includeAnalysis ? "YES" : "NO"}</div>
              <div>- Micro-Tippingpoints: {includeTipping ? "YES" : "NO"}</div>
            </div>

            <div className="space-y-4 pt-2">
              <label className="flex items-center space-x-3 text-xs font-medium cursor-pointer">
                <input 
                  type="checkbox"
                  checked={includeChat}
                  onChange={(e) => setIncludeChat(e.target.checked)}
                  className="w-4 h-4 accent-[#00cfcc] rounded cursor-pointer"
                />
                <span className="text-gray-700">Vollständigen Chatverlauf &amp; Sprachnachrichten einschließen</span>
              </label>

              <label className="flex items-center space-x-3 text-xs font-medium cursor-pointer">
                <input 
                  type="checkbox"
                  checked={includeAnalysis}
                  onChange={(e) => setIncludeAnalysis(e.target.checked)}
                  className="w-4 h-4 accent-[#00cfcc] rounded cursor-pointer"
                />
                <span className="text-gray-700">Semiotische Interpretationsangebote einbetten</span>
              </label>

              <label className="flex items-center space-x-3 text-xs font-medium cursor-pointer">
                <input 
                  type="checkbox"
                  checked={includeTipping}
                  onChange={(e) => setIncludeTipping(e.target.checked)}
                  className="w-4 h-4 accent-[#00cfcc] rounded cursor-pointer"
                />
                <span className="text-gray-700">Divergenz-Kipppunkte ausweisen</span>
              </label>
            </div>

            <SoftButton onClick={handleExportTrigger} disabled={exporting} className="w-full flex items-center justify-center py-3.5 shadow-md">
              {exporting ? (
                <RefreshCw size={15} className="mr-2 animate-spin" />
              ) : (
                <Download size={15} className="mr-2" />
              )}
              <span>{exporting ? "Report wird asynchron kompiliert..." : `Bericht speichern (${format.toUpperCase()})`}</span>
            </SoftButton>

            {exportComplete && (
              <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-center font-bold">
                ✔ Bericht erfolgreich heruntergeladen!
              </div>
            )}
          </SoftCard>
        </div>

      </div>

      {/* Nav Row */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <SoftButton variant="secondary" onClick={onPrev}>
          Zurück zum Dashboard
        </SoftButton>
        <SoftButton variant="ghost" onClick={onReset} className="hover:text-rose-500">
          Workflow zurücksetzen &amp; neu beginnen
        </SoftButton>
      </div>
    </div>
  );
}
