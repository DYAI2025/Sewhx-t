import React, { useState } from 'react';
import { 
  HeartHandshake, BrainCircuit, Activity, Tags, Sparkles, AlertCircle, ChevronDown, ChevronUp, BarChart3, TrendingUp, Grid, HelpCircle, ArrowLeft, ArrowRight
} from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import SoftChip from './ui/SoftChip';
import StatusPill from './ui/StatusPill';
import { MergedChatDocument, AnalysisResult, SectionAnalysisResult } from '../types';

type AnalysisDashboardStepProps = {
  mergedDocument: MergedChatDocument;
  analysisResult: AnalysisResult;
  onPrev: () => void;
  onNext: () => void;
};

export default function AnalysisDashboardStep({
  mergedDocument,
  analysisResult,
  onPrev,
  onNext,
}: AnalysisDashboardStepProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'valuation' | 'markers' | 'semiotics'>('overview');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    mergedDocument.sections.length > 0 ? mergedDocument.sections[0].id : null
  );

  // SVG Valence chart calculations
  const maxValencePoints = analysisResult.valenceSeries.length;
  const padding = 30;
  const chartWidth = 500;
  const chartHeight = 150;

  const pointsString = analysisResult.valenceSeries.map((point, index) => {
    const x = padding + (index / (maxValencePoints - 1 || 1)) * (chartWidth - padding * 2);
    // map valence -1..1 to height-padding..padding
    const y = padding + ((1 - point.value) / 2) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const activePointsString = analysisResult.emotionSeries.map((point, index) => {
    const x = padding + (index / (maxValencePoints - 1 || 1)) * (chartWidth - padding * 2);
    const y = padding + ((1 - point.value) / 2) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Disclaimer Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase bg-teal-50 text-[var(--color-primary)] px-3 py-1 rounded-full border border-teal-100">
            Synthese-Bericht Aktiv
          </span>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1.5">Analyse-Dashboard</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">Auswertung der psychodynamischen Struktur auf Basis lokaler Markerfrequenzen.</p>
        </div>

        <div className="bg-[#fff9eb] border border-amber-200/50 rounded-2xl p-4 text-xs text-amber-800 max-w-md">
          <div className="flex space-x-2">
            <HelpCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Deutungsdisclaimer:</strong> Die generierten Angebote stellen keine absolute Gewissheit dar. Formulierungen sind als Interpretations- und hypothetische Deutungsangebote zu verstehen und dienen ausschließlich der kooperativen Reflexion.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-100 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'overview' 
              ? 'bg-[#e1fbfc] text-[var(--color-primary)] shadow-sm' 
              : 'text-[var(--color-text-secondary)] hover:bg-gray-100/50'
          }`}
        >
          🔍 Übersicht & Deutungen
        </button>
        <button
          onClick={() => setActiveTab('valuation')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'valuation' 
              ? 'bg-[#e1fbfc] text-[var(--color-primary)] shadow-sm' 
              : 'text-[var(--color-text-secondary)] hover:bg-gray-100/50'
          }`}
        >
          📈 Valenzverlauf & Resonanz
        </button>
        <button
          onClick={() => setActiveTab('markers')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
            activeTab === 'markers' 
              ? 'bg-[#e1fbfc] text-[var(--color-primary)] shadow-sm' 
              : 'text-[var(--color-text-secondary)] hover:bg-gray-100/50'
          }`}
        >
          📊 Marker-Frequenzen
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Global Synthese Card */}
          <SoftCard className="p-6 bg-gradient-to-br from-white to-[#fafaf8] border border-white">
            <div className="flex items-center space-x-3 mb-4">
              <BrainCircuit className="text-[var(--color-primary)]" size={24} />
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Sachtextliche Gesamt-Synthese</h3>
            </div>
            <p className="text-xs text-[var(--color-text-primary)] leading-relaxed bg-white p-5 rounded-2xl border border-gray-100/80 shadow-sm font-medium italic">
              "{analysisResult.globalSummary}"
            </p>
          </SoftCard>

          {/* Kipppunkte section inside visual alerts if enabled */}
          {analysisResult.config.detectTippingPoints && analysisResult.tippingPoints.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider flex items-center">
                <AlertCircle className="mr-2" size={16} />
                Erkannte Dissonanz-Kipppunkte
              </h3>

              {analysisResult.tippingPoints.map((tp) => (
                <div key={tp.id} className="bg-rose-50/50 border border-rose-200/50 rounded-3xl p-6 clay-card flex items-start space-x-4">
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                    <Activity size={20} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-rose-800">{tp.title}</h4>
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-3 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Schweregrad: {tp.severity}
                      </span>
                    </div>
                    <p className="text-xs text-rose-700/80 leading-relaxed font-medium">{tp.description}</p>
                    
                    {/* Traceable Evidence line */}
                    <div className="pt-2">
                      <span className="text-[10px] text-rose-600/80 font-bold block mb-1">Evidenzstelle im Gesprächs-Merge:</span>
                      {tp.evidenceMessageIds.map((eid) => {
                        const originalMsg = mergedDocument.messages.find(m => m.id === eid);
                        return originalMsg ? (
                          <div key={eid} className="bg-white p-3 rounded-xl border border-rose-100 text-xs italic text-gray-700">
                            <strong>{originalMsg.sender}:</strong> "{originalMsg.text}"
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section details choosing */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Segment-Synthesen & Interpretationsangebote
            </h3>

            {mergedDocument.sections.map((sec) => {
              const report = analysisResult.sectionResults.find((r) => r.sectionId === sec.id);
              if (!report) return null;
              
              const isExpanded = expandedSectionId === sec.id;

              return (
                <SoftCard key={sec.id} className="p-6 transition-all duration-300">
                  <div 
                    onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{sec.title}</h4>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {new Date(sec.startTimestamp).toLocaleTimeString()} - {new Date(sec.endTimestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {isExpanded && (
                    <div className="mt-6 space-y-6 pt-6 border-t border-gray-100 animate-fadeIn">
                      <p className="text-xs text-[var(--color-text-secondary)] italic leading-relaxed">
                        <strong>Zusammenfassung:</strong> {sec.summary}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bedeutungszuschreibungen */}
                        <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
                          <h5 className="font-bold text-xs text-[var(--color-text-primary)] flex items-center">
                            <Tags className="text-[#00cfcc] mr-1.5" size={14} />
                            Semantische Bedeutungszuschreibung (Interpretationsangebot)
                          </h5>
                          <ul className="space-y-2">
                            {report.semanticMeaning.map((sm, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-primary)] leading-normal pl-3 relative">
                                <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-[#00cfcc] rounded-full" />
                                {sm}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Semiotische Signale */}
                        <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
                          <h5 className="font-bold text-xs text-[var(--color-text-primary)] flex items-center">
                            <Activity className="text-cyan-500 mr-1.5" size={14} />
                            Semiotische Signale & Marker
                          </h5>
                          <ul className="space-y-2">
                            {report.semioticSignals.map((sig, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-primary)] leading-normal pl-3 relative">
                                <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                                {sig}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Possible Interpretations with cautious language */}
                      <div className="bg-cyan-50/30 p-5 rounded-2xl border border-cyan-100/40">
                        <h5 className="font-bold text-xs text-cyan-800 mb-2.5">Hypothetische Deutungsangebote (Vorsichtige Sprache)</h5>
                        <ul className="space-y-2">
                          {report.possibleInterpretations.map((pi, i) => (
                            <li key={i} className="text-xs text-cyan-800/90 leading-relaxed font-medium pl-3 relative">
                              <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-cyan-600 rounded-full" />
                              {pi}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </SoftCard>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'valuation' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Valence Line Curve (Valenzkurve) */}
            <SoftCard className="p-6">
              <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1 flex items-center">
                <TrendingUp size={16} className="text-[var(--color-primary)] mr-2" />
                Valenzverlauf der Konversation
              </h3>
              <p className="text-[11px] text-[var(--color-text-secondary)] mb-4">
                Entwicklung der inhaltlichen Positivität/Dissonanz im Zeitablauf.
              </p>

              <div className="flex justify-center">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#edf2f7" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f7fafc" strokeWidth="1" />
                  <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#f7fafc" strokeWidth="1" />

                  {/* Y Axis text labels */}
                  <text x={padding - 5} y={padding + 4} textAnchor="end" className="text-[8px] fill-emerald-600 font-bold">Positiv (+1)</text>
                  <text x={padding - 5} y={chartHeight / 2 + 3} textAnchor="end" className="text-[8px] fill-gray-400 font-bold">Neutral (0)</text>
                  <text x={padding - 5} y={chartHeight - padding + 3} textAnchor="end" className="text-[8px] fill-rose-500 font-bold">Dissonanz (-1)</text>

                  {/* Line Path */}
                  <polyline
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsString}
                    className="drop-shadow-md"
                  />

                  {/* Dots for timestamps */}
                  {analysisResult.valenceSeries.map((point, index) => {
                    const x = padding + (index / (maxValencePoints - 1 || 1)) * (chartWidth - padding * 2);
                    const y = padding + ((1 - point.value) / 2) * (chartHeight - padding * 2);
                    return (
                      <g key={index} className="group">
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          className="fill-white stroke-[var(--color-primary)] stroke-2 cursor-pointer hover:fill-[var(--color-primary)] transition-colors"
                        />
                        <title>{point.speaker}: Valenz {point.value}</title>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </SoftCard>

            {/* Inherent Activation/Resonance curve */}
            <SoftCard className="p-6">
              <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1 flex items-center">
                <Activity size={16} className="text-purple-500 mr-2" />
                Aktivierung & emotionale Unterströmung
              </h3>
              <p className="text-[11px] text-[var(--color-text-secondary)] mb-4">
                Spannung und Aktivierungsstärke im syntaktischen Gesprächsfluss.
              </p>

              <div className="flex justify-center">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#edf2f7" strokeWidth="1.5" />
                  <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#edf2f7" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Y Axis text label */}
                  <text x={padding - 5} y={padding + 4} textAnchor="end" className="text-[8px] fill-purple-600 font-bold">Hoch (1)</text>
                  <text x={padding - 5} y={chartHeight - padding + 3} textAnchor="end" className="text-[8px] fill-gray-400 font-bold">Ruhig (0)</text>

                  {/* Activation Path */}
                  <polyline
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={activePointsString}
                    className="drop-shadow-md"
                  />

                  {/* Dots */}
                  {analysisResult.emotionSeries.map((point, index) => {
                    const x = padding + (index / (maxValencePoints - 1 || 1)) * (chartWidth - padding * 2);
                    const y = padding + ((1 - point.value) / 2) * (chartHeight - padding * 2);
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          className="fill-white stroke-purple-500 stroke-2 cursor-pointer hover:fill-purple-500 transition-colors"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </SoftCard>
          </div>

          <div className="p-4 bg-gray-50/60 rounded-2xl text-xs text-[var(--color-text-secondary)] leading-relaxed text-center">
            Die Verläufe offenbaren ein phasenweises Anschwellen der Resonanzfrequenz. Besonders im Mittelteil lassen die Emojis und Sprechabschnitte Rückschlüsse auf ein hohes Activation-Niveau zu.
          </div>
        </div>
      )}

      {activeTab === 'markers' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Marker count bars */}
            <SoftCard className="p-6">
              <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1 flex items-center">
                <BarChart3 size={16} className="text-[var(--color-primary)] mr-2" />
                Quantitative Markerzählungen
              </h3>
              <p className="text-[11px] text-[var(--color-text-secondary)] mb-6">
                Frequenzgewichtung der vordefinierten Marker-Kategorien im Dokumentenverlauf.
              </p>

              <div className="space-y-5">
                {analysisResult.markerCounts.map((mc) => {
                  const maxVal = Math.max(...analysisResult.markerCounts.map(m => m.count), 1);
                  const widthPct = (mc.count / maxVal) * 100;
                  
                  const targetCat = analysisResult.config.markerCategories.find(c => c.id === mc.markerId);
                  const color = targetCat?.colorToken || "var(--color-primary)";

                  return (
                    <div key={mc.markerId} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--color-text-primary)] flex items-center">
                          <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: color }} />
                          {mc.label}
                        </span>
                        <span className="font-black text-[var(--color-text-secondary)]">{mc.count} Vorkommen</span>
                      </div>
                      
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                        <div 
                          className="h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${widthPct}%`,
                            backgroundColor: color 
                          }}
                        />
                      </div>

                      {/* Split by Speaker info */}
                      <div className="flex space-x-4 text-[10px] text-[var(--color-text-secondary)] font-medium pl-4">
                        {Object.entries(mc.bySpeaker).map(([spk, val]) => (
                          <span key={spk}>{spk}: <strong>{val}</strong></span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SoftCard>

            {/* Semiotic Heatmap */}
            {analysisResult.config.generateHeatmap && (
              <SoftCard className="p-6">
                <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1 flex items-center">
                  <Grid size={16} className="text-cyan-500 mr-2" />
                  Semiotische Frequenz-Heatmap
                </h3>
                <p className="text-[11px] text-[var(--color-text-secondary)] mb-6">
                  Intensität der Markerfrequenz über die einzelnen Gesprächsabschnitte.
                </p>

                {/* Heatmap Grid rendering */}
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {/* Header */}
                    <div className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">Segment</div>
                    <div className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">Teilnehmer</div>
                    <div className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">Kategorie</div>
                    <div className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase text-center">Intensität</div>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {analysisResult.heatmap.map((cell, idx) => {
                      const section = mergedDocument.sections.find(s => s.id === cell.sectionId);
                      const category = analysisResult.config.markerCategories.find(c => c.id === cell.markerId);
                      const pct = Math.floor(cell.intensity * 100);

                      return (
                        <div key={idx} className="grid grid-cols-4 gap-2 items-center text-xs p-2 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-gray-100">
                          <span className="font-semibold text-gray-500 truncate">{section?.title.split(":")[0] || "Segment"}</span>
                          <span className="font-bold text-[var(--color-text-primary)]">{cell.speaker}</span>
                          <span className="text-gray-600 truncate">{category?.label || "Marker"}</span>
                          <div className="flex items-center justify-center space-x-1">
                            {/* Color Block reflecting intensity */}
                            <div 
                              className="w-16 h-3 rounded-full text-[10px] flex items-center justify-center font-bold text-white shadow-inner"
                              style={{ 
                                backgroundColor: `rgba(0, 207, 204, ${cell.intensity})`,
                                color: cell.intensity > 0.5 ? 'white' : '#252833'
                              }}
                            >
                              {pct}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SoftCard>
            )}

          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-10">
        <SoftButton variant="secondary" onClick={onPrev}>
          Zurück zur Konfiguration
        </SoftButton>
        <SoftButton onClick={onNext} className="shadow-md">
          Export vorbereiten
        </SoftButton>
      </div>
    </div>
  );
}
