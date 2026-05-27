import React, { useState } from 'react';
import { Download, FileDown, Eye, CheckSquare, Square, FileImage, Sparkles, FolderDown, RefreshCw } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import SoftChip from './ui/SoftChip';
import StatusPill from './ui/StatusPill';
import { MergedChatDocument, AnalysisResult } from '../types';
import { exportDocument } from '../lib/mockServices';

type ExportStepProps = {
  mergedDocument: MergedChatDocument;
  analysisResult: AnalysisResult;
  onPrev: () => void;
  onReset: () => void;
};

export default function ExportStep({
  mergedDocument,
  analysisResult,
  onPrev,
  onReset,
}: ExportStepProps) {
  const [format, setFormat] = useState<'json' | 'pdf' | 'markdown' | 'txt' | 'html'>('markdown');
  
  // Custom checklist items
  const [includeChat, setIncludeChat] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeTipping, setIncludeTipping] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const formats: { key: typeof format; label: string; desc: string; ext: string }[] = [
    { key: 'markdown', label: 'Markdown (.md)', desc: 'Strukturierte Gliederung für GitHub, Obsidian oder Notion.', ext: 'md' },
    { key: 'html', label: 'Interaktiver HTML-Report', desc: 'Modernes ansprechendes Layout mit eingebetteter CSS-Struktur.', ext: 'html' },
    { key: 'txt', label: 'Klartext (.txt)', desc: 'Schlichtes ASCII-Protokoll, ideal für die unkomplizierte Archivierung.', ext: 'txt' },
    { key: 'json', label: 'Daten-JSON (.json)', desc: 'Vollständig maschinenlesbares Dokument mit allen Metadaten.', ext: 'json' },
    { key: 'pdf', label: 'Synthese-Briefing (.pdf)', desc: 'Optimierter, zweiseitiger Bericht mit grafischen Visualisierungen.', ext: 'pdf' },
  ];

  // Perform Blob Download triggers inside user browser
  const handleExportTrigger = () => {
    setExporting(true);
    setExportComplete(false);

    setTimeout(() => {
      const generated = exportDocument(mergedDocument, analysisResult, format);
      
      // Browser Download Blob
      const blob = new Blob([generated.content], { type: generated.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generated.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExporting(false);
      setExportComplete(true);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Bericht & Exportkonfiguration</h2>
        <p className="text-xs text-[var(--color-text-secondary)]">Wähle dein bevorzugtes Zielformat und passe die Exportbestandteile individuell an.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Format choosing & inclusions */}
        <div className="lg:col-span-6 space-y-6">
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            1. Exportformat wählen
          </h3>

          <div className="space-y-3">
            {formats.map((f) => {
              const isSelected = f.key === format;
              return (
                <SoftCard
                  key={f.key}
                  interactive
                  active={isSelected}
                  onClick={() => {
                    setFormat(f.key);
                    setExportComplete(false);
                  }}
                  className="p-4 flex items-center space-x-4 border border-white/60 text-left"
                >
                  <div className={`p-3 rounded-2xl ${
                    isSelected ? 'bg-[#e6fcfc] text-[var(--color-primary)]' : 'bg-gray-50 text-gray-450'
                  }`}>
                    <FileDown size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{f.label}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </SoftCard>
              );
            })}
          </div>

          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider pt-4">
            2. Report-Bestandteile anpassen
          </h3>

          <div className="bg-white rounded-[32px] clay-card p-6 border border-white space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer select-none text-sm font-semibold">
              <input
                type="checkbox"
                checked={includeChat}
                onChange={(e) => setIncludeChat(e.target.checked)}
                className="w-4 h-4 accent-[#00cfcc] rounded cursor-pointer"
              />
              <span className="text-gray-700">Vollständigen Chatverlauf & Audiorotationen inkludieren</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer select-none text-sm font-semibold">
              <input
                type="checkbox"
                checked={includeAnalysis}
                onChange={(e) => setIncludeAnalysis(e.target.checked)}
                className="w-4 h-4 accent-[#00cfcc] rounded cursor-pointer"
              />
              <span className="text-gray-700">Semiotische Interpretationsangebote einbetten</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer select-none text-sm font-semibold">
              <input
                type="checkbox"
                checked={includeStats}
                onChange={(e) => setIncludeStats(e.target.checked)}
                className="w-4 h-4 accent-[#00cfcc] rounded cursor-pointer"
              />
              <span className="text-gray-700">Markerstatistiken & Häufigkeiten</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer select-none text-sm font-semibold">
              <input
                type="checkbox"
                checked={includeTipping}
                onChange={(e) => setIncludeTipping(e.target.checked)}
                className="w-4 h-4 accent-[#00cfcc] rounded cursor-pointer"
              />
              <span className="text-gray-700">Dissonanz-Kipppunkte & Evidenzstellen ausweisen</span>
            </label>
          </div>
        </div>

        {/* Right Column: Live Report Preview container */}
        <div className="lg:col-span-6 space-y-6">
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center">
            <Eye className="mr-2 text-[var(--color-primary)]" size={16} />
            Echtzeit Report-Vorschau
          </h3>

          <div className="bg-white rounded-[32px] clay-card p-6 border border-white space-y-4 max-h-[420px] overflow-y-auto pr-1">
            <div className="border bg-[#fdfdfb] p-6 rounded-2xl border-dashed border-gray-200 space-y-6 text-xs text-[var(--color-text-primary)] font-mono leading-relaxed">
              <div className="space-y-1">
                <div>=== WORDTHREAD SUMMARY REPORT ===</div>
                <div>Datum: {new Date().toLocaleDateString()}</div>
                <div>Teilnehmer: {mergedDocument.participants.join(", ")}</div>
                <div>Formatgruppe: {format.toUpperCase()}</div>
              </div>

              {includeAnalysis && (
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <div className="font-bold uppercase tracking-wider text-[var(--color-primary)]">Globales Interpretationsvorhaben:</div>
                  <p className="italic bg-white p-3 rounded border border-gray-100 font-sans">
                    "{analysisResult.globalSummary}"
                  </p>
                </div>
              )}

              {includeStats && (
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <div className="font-bold uppercase tracking-wider">Muster-Frequenz-Synthese:</div>
                  {analysisResult.markerCounts.map((mc, idx) => (
                    <div key={idx}>- {mc.label}: {mc.count} Treffer im Mergefaden</div>
                  ))}
                </div>
              )}

              {includeTipping && analysisResult.tippingPoints.length > 0 && (
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <div className="font-bold uppercase tracking-wider text-rose-600">Divergenz-Kipppunkte:</div>
                  {analysisResult.tippingPoints.map((tp, idx) => (
                    <div key={idx} className="bg-rose-50/50 p-2.5 rounded border border-rose-100 font-sans">
                      <strong>{tp.title}:</strong> {tp.description}
                    </div>
                  ))}
                </div>
              )}

              {includeChat && (
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="font-bold uppercase tracking-wider">Merged Gesprächsschleife:</div>
                  {mergedDocument.messages.slice(0, 3).map((m, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded border border-gray-150">
                      <strong>{m.sender}:</strong> "{m.text.substring(0, 70)}..."
                    </div>
                  ))}
                  {mergedDocument.messages.length > 3 && (
                    <div className="text-gray-400 italic text-[10px] text-center pt-2">
                      [... {mergedDocument.messages.length - 3} weitere Nachrichten komprimiert]
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Downloader Trigger button */}
            <div className="pt-4">
              <SoftButton
                onClick={handleExportTrigger}
                disabled={exporting}
                className="w-full flex items-center justify-center space-x-2 py-4 shadow-lg shadow-cyan-100"
              >
                {exporting ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <Download size={18} />
                )}
                <span>
                  {exporting ? "Report wird vorbereitet..." : `Report herunterladen (${format.toUpperCase()})`}
                </span>
              </SoftButton>

              {exportComplete && (
                <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl p-3 text-center mt-3 animate-fadeIn">
                  Download erfolgreich gestartet! Die Datei wurde lokal in deinem Browser zusammengestellt.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Navigation and Workflow resetting */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-10">
        <SoftButton variant="secondary" onClick={onPrev}>
          Zurück zu Dashboard
        </SoftButton>
        <SoftButton variant="ghost" onClick={onReset} className="hover:text-rose-500">
          🔄 Gesamten Workflow zurücksetzen & neu starten
        </SoftButton>
      </div>
    </div>
  );
}
