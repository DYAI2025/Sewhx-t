import React, { useState } from 'react';
import { HeartHandshake, BrainCircuit, Activity, Tags, Sparkles, AlertCircle, ChevronDown, ChevronUp, BarChart3, TrendingUp, Grid, HelpCircle, ArrowLeft, ArrowRight, Scale, RefreshCw, Loader2 } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import StatusPill from './ui/StatusPill';
import { apiClient } from '../lib/apiClient';

type AnalysisDashboardStepProps = {
  mergedDocument: any;
  analysisResult: any;
  onPrev: () => void;
  onNext: () => void;
};

export default function AnalysisDashboardStep({
  mergedDocument,
  analysisResult,
  onPrev,
  onNext
}: AnalysisDashboardStepProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'timeline' | 'details' | 'compare'>('profile');
  const [expandedSecId, setExpandedSecId] = useState<string | null>(
    mergedDocument.sections.length > 0 ? mergedDocument.sections[0].id : null
  );

  // Comparison states
  const [secondaryFocus, setSecondaryFocus] = useState("Konflikt- & Krisensymptome");
  const [secondaryResult, setSecondaryResult] = useState<any | null>(null);
  const [isComputingSecondary, setIsComputingSecondary] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<'delta' | 'sidebyside'>('delta');
  const [hoveredCell, setHoveredCell] = useState<{ markerId: string; sectionId: string } | null>(null);

  const getAvgIntensity = (result: any, markerId: string, sectionId: string): number => {
    if (!result || !result.heatmap) return 0;
    const cells = result.heatmap.filter((c: any) => c.markerId === markerId && c.sectionId === sectionId);
    if (cells.length === 0) return 0;
    const sum = cells.reduce((acc: number, c: any) => acc + c.intensity, 0);
    return sum / cells.length;
  };

  const predefinedFocusPaths = [
    { label: "⚠️ Krisen & Konflikte", focus: "Konflikt- & Krisensymptome" },
    { label: "💬 Empathie & Resonanz", focus: "Emotionale Resonanz & Bindungsförderung" },
    { label: "🛠️ Sachliche Analyse", focus: "Effizienz, Leistungsdruck & Rollentrennung" },
    { label: "👑 Status & Hierarchie", focus: "Durchsetzungsmuster & paralinguistische Privilegien" }
  ];

  const handleRunSecondaryAnalysis = async (focusToRun?: string) => {
    const focusVal = focusToRun || secondaryFocus;
    if (!focusVal.trim()) return;
    setIsComputingSecondary(true);
    setComparisonError(null);

    const secondaryConfig = {
      ...analysisResult.config,
      topicFocus: focusVal
    };

    try {
      const result = await apiClient.runSemioticMarkerSense(
        mergedDocument.id,
        mergedDocument,
        secondaryConfig
      );
      setSecondaryResult(result);
      if (focusToRun) {
        setSecondaryFocus(focusToRun);
      }
    } catch (e: any) {
      console.error(e);
      setComparisonError("Fehler bei der Berechnung der Vergleichsanalyse.");
    } finally {
      setIsComputingSecondary(false);
    }
  };

  // SVG parameters
  const chartWidth = 500;
  const chartHeight = 160;
  const padding = 34;

  const pointsString = analysisResult.valenceSeries.map((point: any, index: number) => {
    const x = padding + (index / (analysisResult.valenceSeries.length - 1 || 1)) * (chartWidth - padding * 2);
    const y = padding + ((1 - point.value) / 2) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const activePointsString = analysisResult.emotionSeries.map((point: any, index: number) => {
    const x = padding + (index / (analysisResult.emotionSeries.length - 1 || 1)) * (chartWidth - padding * 2);
    const y = padding + ((1 - point.value) / 2) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-8 animate-fadeIn" id="semiotic-dashboard-container">
      {/* Disclaimer Banner first to guarantee legal safehold */}
      <div className="bg-[#fff9eb] border border-amber-200/40 rounded-[32px] p-6 clay-card flex items-start space-x-3.5">
        <HelpCircle size={22} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-amber-900 text-xs mb-1">Deutungsdisclaimer &amp; Systemische Vorsicht</h4>
          <p className="text-[10.5px] text-amber-850 leading-relaxed font-semibold">
            Alle ausgewiesenen Rollenzuweisungen und Aktivierungspotenziale verstehen sich als hypothetische Deutungsangebote zur interpersonellen Dynamik. Es werden keine definitiven klinischen Aussagen über Absichten oder therapeutische Indikationen formuliert.
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex space-x-2 border-b border-gray-100 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all shrink-0 ${
            activeTab === 'profile' 
              ? 'bg-[#e1fbfc] text-[var(--color-primary)] shadow-sm' 
              : 'text-[var(--color-text-secondary)] hover:bg-gray-100/50'
          }`}
        >
          🔍 Semiotisches Rollenprofil
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all shrink-0 ${
            activeTab === 'timeline' 
              ? 'bg-[#e1fbfc] text-[var(--color-primary)] shadow-sm' 
              : 'text-[var(--color-text-secondary)] hover:bg-gray-100/50'
          }`}
        >
          📈 Beziehungsverläufe (Resonanz)
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all shrink-0 ${
            activeTab === 'details' 
              ? 'bg-[#e1fbfc] text-[var(--color-primary)] shadow-sm' 
              : 'text-[var(--color-text-secondary)] hover:bg-gray-100/50'
          }`}
        >
          💬 Evidenzen &amp; Abschnitte
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all shrink-0 ${
            activeTab === 'compare' 
              ? 'bg-[#e1fbfc] text-[var(--color-primary)] shadow-sm' 
              : 'text-[var(--color-text-secondary)] hover:bg-gray-100/50'
          }`}
        >
          ⚖️ Fokus-Vergleich (Compare)
        </button>
      </div>

      {/* Tab contents */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          {/* Integrated Summary Card */}
          <SoftCard className="p-6 bg-gradient-to-br from-white to-[#fafaf8]">
            <div className="flex items-center space-x-2.5 mb-3">
              <BrainCircuit className="text-[var(--color-primary)]" />
              <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Systemisches Gesamtergebnis</h3>
            </div>
            <p className="text-xs text-[var(--color-text-primary)] italic leading-relaxed bg-white p-5 rounded-2xl border border-gray-150/80 shadow-sm font-medium">
              "{analysisResult.globalSummary}"
            </p>
          </SoftCard>

          {/* Marker distribution stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <SoftCard className="p-6">
              <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-4 flex items-center">
                <BarChart3 className="text-[var(--color-primary)] mr-2" size={16} />
                Marker-Verteilung im Detail
              </h3>
              
              <div className="space-y-5">
                {analysisResult.markerCounts.map((mc: any) => {
                  const target = analysisResult.config.markerCategories.find((c: any) => c.id === mc.markerId);
                  const color = target?.colorToken || "var(--color-primary)";
                  const pct = Math.min((mc.count / 8) * 100, 100);

                  return (
                    <div key={mc.markerId} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span className="flex items-center">
                          <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: color }} />
                          {mc.label}
                        </span>
                        <span>{mc.count} Treffer</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SoftCard>

            {/* Micro-Tippingpoints Alert Box */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">
                Schnittstellen-Warnungen
              </h3>
              {analysisResult.config.detectTippingPoints && analysisResult.tippingPoints.map((tp: any) => (
                <div key={tp.id} className="bg-rose-50/50 border border-rose-200/50 rounded-2xl p-5 space-y-2.5">
                  <div className="flex justify-between items-center text-rose-800 text-xs font-bold">
                    <span className="flex items-center">
                      <AlertCircle size={15} className="mr-1.5" />
                      {tp.title}
                    </span>
                    <span className="text-[9px] bg-rose-100 px-2.5 py-0.5 rounded-full uppercase font-black">
                      Severity: {tp.severity}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-rose-700 leading-relaxed font-semibold">{tp.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Valence timeline svg */}
          <SoftCard className="p-6">
            <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1 flex items-center">
              <TrendingUp className="text-[var(--color-primary)] mr-2" size={16} />
              Valenzkurve (Dissonanz vs Positivität)
            </h3>
            <p className="text-[10px] text-gray-400 mb-4">Rechnerisches Verhältnis von kooperativen zu distanzierenden Elementen.</p>
            
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-full overflow-visible">
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#edf2f7" strokeWidth="2" strokeDasharray="3 3" />
              <polyline fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pointsString} />
              {analysisResult.valenceSeries.map((point: any, idx: number) => {
                const x = padding + (idx / (analysisResult.valenceSeries.length - 1 || 1)) * (chartWidth - padding * 2);
                const y = padding + ((1 - point.value) / 2) * (chartHeight - padding * 2);
                return (
                  <circle key={idx} cx={x} cy={y} r="4" className="fill-white stroke-[var(--color-primary)] stroke-2" />
                );
              })}
              <text x={padding - 5} y={padding + 3} textAnchor="end" className="text-[8px] fill-emerald-600 font-bold">Kooperativ</text>
              <text x={padding - 5} y={chartHeight - padding + 3} textAnchor="end" className="text-[8px] fill-rose-500 font-bold">Abgrenzung</text>
            </svg>
          </SoftCard>

          {/* Activeness timeline svg */}
          <SoftCard className="p-6">
            <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1 flex items-center">
              <Activity className="text-purple-500 mr-2" size={16} />
              Aktivierungsstärke (Resonanzfrequenz)
            </h3>
            <p className="text-[10px] text-gray-400 mb-4">Sprechfrequenz und emotionales Signalniveau über den Zeitverlauf.</p>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-full overflow-visible">
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#edf2f7" strokeWidth="1.5" />
              <polyline fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={activePointsString} />
              {analysisResult.emotionSeries.map((point: any, idx: number) => {
                const x = padding + (idx / (analysisResult.emotionSeries.length - 1 || 1)) * (chartWidth - padding * 2);
                const y = padding + ((1 - point.value) / 2) * (chartHeight - padding * 2);
                return (
                  <circle key={idx} cx={x} cy={y} r="4" className="fill-white stroke-purple-500 stroke-2" />
                );
              })}
              <text x={padding - 5} y={padding + 3} textAnchor="end" className="text-[8px] fill-purple-600 font-bold">Aktiviert</text>
            </svg>
          </SoftCard>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Deutungen &amp; Abschnitte
          </h3>

          {mergedDocument.sections.map((sec: any) => {
            const report = analysisResult.sectionResults.find((r: any) => r.sectionId === sec.id);
            if (!report) return null;
            const expanded = expandedSecId === sec.id;

            return (
              <SoftCard key={sec.id} className="p-5">
                <div onClick={() => setExpandedSecId(expanded ? null : sec.id)} className="flex justify-between items-center cursor-pointer">
                  <div>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase mr-2">Segment</span>
                    <h4 className="font-bold text-xs text-[var(--color-text-primary)] inline-block">{sec.title}</h4>
                  </div>
                  {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>

                {expanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 text-xs animate-fadeIn">
                    <p className="text-gray-500 leading-relaxed italic">"{sec.summary}"</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Semiotic */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-100">
                        <span className="font-bold text-[11px] text-[var(--color-primary)] block mb-1">Semiotische Signale</span>
                        <ul className="space-y-1 list-disc pl-4 text-gray-600">
                          {report.semioticSignals.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Interpretations */}
                      <div className="bg-cyan-50/30 p-4 rounded-xl border border-cyan-100/30">
                        <span className="font-bold text-[11px] text-cyan-800 block mb-1">Deutungsangebote</span>
                        <ul className="space-y-1 list-disc pl-4 text-cyan-800/90">
                          {report.possibleInterpretations.map((p: string, i: number) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </SoftCard>
            );
          })}
        </div>
      )}

      {/* Compare Tab panel */}
      {activeTab === 'compare' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Comparison Intro Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-[28px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-gray-800 flex items-center">
                <Scale className="mr-2 text-[var(--color-primary)] animate-pulse" size={18} />
                Analytischer Fokus-Vergleich (Side-by-Side)
              </h3>
              <p className="text-[11px] text-gray-500 mt-1 max-w-xl">
                Vergleiche zwei Fokus-Einstellungen nebeneinander, um paralinguistische Resonanzen, Bedeutungsverschiebungen und die Dynamik der Marker-Klassen unter verschiedenen Perspektiven zu prüfen.
              </p>
            </div>
            {secondaryResult && (
              <SoftButton 
                variant="ghost" 
                onClick={() => { setSecondaryResult(null); setSecondaryFocus("Konflikt- & Krisensymptome"); }}
                className="text-xs text-rose-500 hover:bg-rose-50 rounded-xl shrink-0"
              >
                Zurücksetzen
              </SoftButton>
            )}
          </div>

          {/* Configuration Form & Presets */}
          <div className="grid grid-cols-1 gap-8 items-start">
            <div className="space-y-4">
              <SoftCard className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                  <div className="w-full space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Analytischer Vergleichsfokus (Eingabe oder Klick auf Preset unten)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={secondaryFocus}
                        onChange={(e) => setSecondaryFocus(e.target.value)}
                        placeholder="z.B. Konflikt- & Krisensymptome, Psychodynamik..."
                        className="w-full bg-slate-50 border border-gray-150 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 outline-none"
                      />
                      <SoftButton 
                        onClick={() => handleRunSecondaryAnalysis()}
                        disabled={isComputingSecondary}
                        className="shadow-sm flex items-center shrink-0"
                      >
                        {isComputingSecondary ? (
                          <Loader2 size={14} className="animate-spin mr-1.5" />
                        ) : (
                          <RefreshCw size={14} className="mr-1.5" />
                        )}
                        Vergleichen
                      </SoftButton>
                    </div>
                  </div>
                </div>

                {/* Quick Presets row */}
                <div className="space-y-2.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Schnell-Auswahl Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    {predefinedFocusPaths.map((p) => {
                      const isActive = secondaryFocus === p.focus;
                      return (
                        <button
                          key={p.label}
                          onClick={() => handleRunSecondaryAnalysis(p.focus)}
                          disabled={isComputingSecondary}
                          className={`text-[10.5px] px-3.5 py-2 font-black rounded-xl transition-all border ${
                            isActive 
                              ? "bg-slate-900 text-white border-slate-900" 
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-350"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {comparisonError && (
                  <div className="text-xs text-rose-600 font-bold bg-rose-50/50 border border-rose-100 p-2.5 rounded-xl">
                    ⚠️ {comparisonError}
                  </div>
                )}
              </SoftCard>
            </div>
          </div>

          {/* Results Comparison Grid */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Focus Card */}
              <SoftCard className="p-6 border-l-4 border-l-[var(--color-primary)] bg-gradient-to-br from-white to-[#fafaf8]">
                <div className="flex items-center space-x-2.5 mb-2.5">
                  <BrainCircuit size={16} className="text-[var(--color-primary)] shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--color-primary)]">Fokus A: {analysisResult.config.topicFocus}</span>
                </div>
                <p className="text-xs text-slate-800 font-medium italic leading-relaxed bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  "{analysisResult.globalSummary}"
                </p>
              </SoftCard>

              {/* Secondary Focus Card */}
              <SoftCard className={`p-6 border-l-4 transition-all duration-300 ${secondaryResult ? 'border-l-purple-500 bg-gradient-to-br from-white to-[#fafafc]' : 'border-l-gray-300'}`}>
                {secondaryResult ? (
                  <>
                    <div className="flex items-center space-x-2.5 mb-2.5">
                      <BrainCircuit size={16} className="text-purple-500 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider text-purple-600">Fokus B: {secondaryResult.config.topicFocus}</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium italic leading-relaxed bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      "{secondaryResult.globalSummary}"
                    </p>
                  </>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-2.5">
                    <span className="text-3xl animate-bounce">⚖️</span>
                    <span className="text-xs font-black text-gray-400">Vergleichs-Perspektive ausstehend</span>
                    <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs">Wähle oben einen Vergleichsfokus &amp; klicke "Vergleichen", um die paralinguistische Gegenüberstellung zu aktivieren.</p>
                  </div>
                )}
              </SoftCard>
            </div>

            {/* Side-by-Side Marker Comparison */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center pl-1">
                <BarChart3 size={14} className="mr-1.5" />
                Klassen-Frequenzen im Vergleich
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analysisResult.config.markerCategories.map((mc: any) => {
                  const primaryCount = analysisResult.markerCounts.find((c: any) => c.markerId === mc.id)?.count || 0;
                  const secondaryCount = secondaryResult 
                    ? (secondaryResult.markerCounts.find((c: any) => c.markerId === mc.id)?.count || 0)
                    : 0;
                  const color = mc.colorToken || "var(--color-primary)";
                  const maxVal = Math.max(primaryCount, secondaryCount, 1);
                  const leftPct = (primaryCount / maxVal) * 100;
                  const rightPct = (secondaryCount / maxVal) * 100;

                  return (
                    <div key={mc.id} className="p-5 bg-white rounded-[28px] border border-gray-100 hover:border-gray-200 transition-all duration-200 shadow-sm flex flex-col justify-between space-y-4">
                      {/* Class Label */}
                      <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                        <span className="flex items-center">
                          <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: color }} />
                          {mc.label}
                        </span>
                        <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-extrabold">
                          Klasse
                        </span>
                      </div>

                      {/* Side-by-Side Dual Bar Graph */}
                      <div className="space-y-3.5">
                        {/* Primär */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-gray-500">
                            <span className="truncate max-w-[130px]" title={analysisResult.config.topicFocus}>A ({analysisResult.config.topicFocus})</span>
                            <span className="text-gray-700">{primaryCount} Hits</span>
                          </div>
                          <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${leftPct}%`, backgroundColor: color }} />
                          </div>
                        </div>

                        {/* Sekundär */}
                        {secondaryResult ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-gray-500">
                              <span className="truncate max-w-[130px]" title={secondaryResult.config.topicFocus}>B ({secondaryResult.config.topicFocus})</span>
                              <span className="text-gray-750 font-bold">{secondaryCount} Hits</span>
                            </div>
                            <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${rightPct}%`, backgroundColor: color, opacity: 0.7 }} />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50/50 p-2.5 rounded-xl text-center text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">
                            Fokus B ungeladen
                          </div>
                        )}
                      </div>

                      {/* Shift text */}
                      {secondaryResult && (
                        <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] font-black">
                          <span className="text-gray-400 uppercase tracking-wider">Shift Delta:</span>
                          {primaryCount === secondaryCount ? (
                            <span className="text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full">unverändert</span>
                          ) : primaryCount < secondaryCount ? (
                            <span className="text-emerald-700 bg-emerald-55 px-2.5 py-0.5 rounded-full flex items-center">
                              +{secondaryCount - primaryCount} (+{Math.round(((secondaryCount - primaryCount) / primaryCount) * 100)}%) 📈
                            </span>
                          ) : (
                            <span className="text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full flex items-center">
                              -{primaryCount - secondaryCount} (-{Math.round(((primaryCount - secondaryCount) / primaryCount) * 100)}%) 📉
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COMPARATIVE HEATMAP VIEW */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pl-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <Grid size={14} className="mr-1.5" />
                  Vergleichende Intensitäts-Heatmap (Config A vs. Config B)
                </h4>
                {secondaryResult && (
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-gray-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setHeatmapMode('delta')}
                      className={`px-2.5 py-1 rounded-[9px] transition-all ${
                        heatmapMode === 'delta' 
                          ? 'bg-slate-950 text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      ⚖️ Verschiebung (Delta)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeatmapMode('sidebyside')}
                      className={`px-2.5 py-1 rounded-[9px] transition-all ${
                        heatmapMode === 'sidebyside' 
                          ? 'bg-slate-950 text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      📁 Fokus A &amp; B getrennt
                    </button>
                  </div>
                )}
              </div>

              {!secondaryResult ? (
                <SoftCard className="p-8 text-center bg-slate-50/50 border border-slate-100 flex flex-col items-center justify-center space-y-3">
                  <span className="text-3xl">🧩</span>
                  <span className="text-xs font-black text-gray-400">Vergleichs-Heatmap inaktiv</span>
                  <p className="text-[10px] text-gray-400 max-w-sm leading-relaxed">
                    Wähle oben einen Vergleichsfokus &amp; starte "Vergleichen", um eine vergleichende Phasen-Heatmap über alle Segmente und Marker-Klassen hinweg zu zeichnen.
                  </p>
                </SoftCard>
              ) : (
                <div className="space-y-6">
                  {heatmapMode === 'delta' ? (
                    <SoftCard className="p-6">
                      <div className="mb-4">
                        <h5 className="font-bold text-xs text-gray-800">
                          Intensitäts-Shift Delta-Ansicht (Fokus B minus Fokus A)
                        </h5>
                        <p className="text-[10px] text-gray-400 leading-normal">
                          Farbliche Darstellung der Verschiebung. Grün steht für Anstieg des Bedeutungspotenzials, Rot für Abschwächung im Referenzrahmen.
                        </p>
                      </div>

                      {/* The Heatmap Grid Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="py-2.5 px-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider w-[180px]">Marker-Klasse</th>
                              {mergedDocument.sections.map((sec: any, idx: number) => (
                                <th 
                                  key={sec.id} 
                                  className="py-2.5 px-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider text-center cursor-help min-w-[80px]"
                                  title={sec.title}
                                >
                                  S{idx + 1}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResult.config.markerCategories.map((mc: any) => (
                              <tr key={mc.id} className="border-b border-gray-100 last:border-none">
                                <td className="py-3 px-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: mc.colorToken }} />
                                    <span className="text-[11px] font-bold text-gray-700 truncate max-w-[150px]" title={mc.label}>
                                      {mc.label}
                                    </span>
                                  </div>
                                </td>
                                {mergedDocument.sections.map((sec: any) => {
                                  const valA = getAvgIntensity(analysisResult, mc.id, sec.id);
                                  const valB = getAvgIntensity(secondaryResult, mc.id, sec.id);
                                  const diff = valB - valA;
                                  const diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
                                  
                                  // Determine cell color based on difference
                                  let bgStyle: React.CSSProperties = { backgroundColor: 'rgba(241, 245, 249, 0.4)' };
                                  let textClass = 'text-gray-500';
                                  
                                  if (diff > 0.02) {
                                    bgStyle = { backgroundColor: `rgba(16, 185, 129, ${Math.min(0.08 + Math.abs(diff) * 0.85, 0.95)})` };
                                    textClass = Math.abs(diff) > 0.45 ? 'text-white font-black' : 'text-emerald-800 font-bold';
                                  } else if (diff < -0.02) {
                                    bgStyle = { backgroundColor: `rgba(244, 63, 94, ${Math.min(0.08 + Math.abs(diff) * 0.85, 0.95)})` };
                                    textClass = Math.abs(diff) > 0.45 ? 'text-white font-black' : 'text-rose-800 font-bold';
                                  }

                                  const isSelected = hoveredCell?.markerId === mc.id && hoveredCell?.sectionId === sec.id;

                                  return (
                                    <td 
                                      key={sec.id} 
                                      className="p-1 text-center"
                                      onMouseEnter={() => setHoveredCell({ markerId: mc.id, sectionId: sec.id })}
                                      onMouseLeave={() => setHoveredCell(null)}
                                    >
                                      <div 
                                        style={bgStyle} 
                                        className={`py-3 px-1 rounded-xl text-[11px] leading-tight transition-all cursor-[crosshair] ${textClass} ${
                                          isSelected ? 'ring-2 ring-slate-900 shadow-sm scale-[1.03]' : 'hover:scale-[1.02]'
                                        }`}
                                      >
                                        {diffStr}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Legend Row */}
                      <div className="mt-5 pt-4 border-t border-gray-50 flex flex-wrap justify-between items-center text-[10px] gap-2.5">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-400 uppercase tracking-widest font-black">Legende:</span>
                          <span className="flex items-center">
                            <span className="w-3 h-3 rounded bg-rose-500/80 mr-1.5" /> Abschwächung (B &lt; A)
                          </span>
                          <span className="flex items-center">
                            <span className="w-3 h-3 rounded bg-slate-100 mr-1.5" /> Kaum Veränderung
                          </span>
                          <span className="flex items-center">
                            <span className="w-3 h-3 rounded bg-emerald-500/80 mr-1.5" /> Intensivierung (B &gt; A)
                          </span>
                        </div>
                        <span className="text-gray-400 italic">Nutze Mouseover für Detail-Metadaten</span>
                      </div>
                    </SoftCard>
                  ) : (
                    /* Side-by-side mode */
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      
                      {/* FOCUS A Heatmap */}
                      <SoftCard className="p-6">
                        <div className="mb-4">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-primary)]">Config A</span>
                          <h5 className="font-bold text-xs text-gray-800 -mt-0.5 truncate animate-none" title={analysisResult.config.topicFocus}>
                            {analysisResult.config.topicFocus}
                          </h5>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="py-2.5 px-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider w-[160px]">Marker-Klasse</th>
                                {mergedDocument.sections.map((sec: any, idx: number) => (
                                  <th key={sec.id} className="py-2.5 px-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider text-center" title={sec.title}>
                                    S{idx + 1}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {analysisResult.config.markerCategories.map((mc: any) => (
                                <tr key={mc.id} className="border-b border-gray-100 last:border-none">
                                  <td className="py-3 px-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: mc.colorToken }} />
                                      <span className="text-[11px] font-bold text-gray-700 truncate max-w-[130px]" title={mc.label}>
                                        {mc.label}
                                      </span>
                                    </div>
                                  </td>
                                  {mergedDocument.sections.map((sec: any) => {
                                    const valA = getAvgIntensity(analysisResult, mc.id, sec.id);
                                    const isSelected = hoveredCell?.markerId === mc.id && hoveredCell?.sectionId === sec.id;

                                    return (
                                      <td 
                                        key={sec.id} 
                                        className="p-1 text-center"
                                        onMouseEnter={() => setHoveredCell({ markerId: mc.id, sectionId: sec.id })}
                                        onMouseLeave={() => setHoveredCell(null)}
                                      >
                                        <div 
                                          style={{ backgroundColor: mc.colorToken, opacity: 0.15 + valA * 0.85 }} 
                                          className={`py-3 px-1 rounded-xl text-[11px] leading-tight transition-all cursor-pointer font-bold ${
                                            valA > 0.45 ? 'text-slate-900' : 'text-slate-700'
                                          } ${
                                            isSelected ? 'ring-2 ring-slate-900 shadow-sm' : ''
                                          }`}
                                        >
                                          {valA.toFixed(2)}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </SoftCard>

                      {/* FOCUS B Heatmap */}
                      <SoftCard className="p-6">
                        <div className="mb-4">
                          <span className="text-[9px] font-black uppercase tracking-wider text-purple-600">Config B</span>
                          <h5 className="font-bold text-xs text-gray-800 -mt-0.5 truncate" title={secondaryResult.config.topicFocus}>
                            {secondaryResult.config.topicFocus}
                          </h5>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="py-2.5 px-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider w-[160px]">Marker-Klasse</th>
                                {mergedDocument.sections.map((sec: any, idx: number) => (
                                  <th key={sec.id} className="py-2.5 px-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider text-center" title={sec.title}>
                                    S{idx + 1}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {analysisResult.config.markerCategories.map((mc: any) => (
                                <tr key={mc.id} className="border-b border-gray-100 last:border-none">
                                  <td className="py-3 px-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: mc.colorToken }} />
                                      <span className="text-[11px] font-bold text-gray-700 truncate max-w-[130px]" title={mc.label}>
                                        {mc.label}
                                      </span>
                                    </div>
                                  </td>
                                  {mergedDocument.sections.map((sec: any) => {
                                    const valB = getAvgIntensity(secondaryResult, mc.id, sec.id);
                                    const isSelected = hoveredCell?.markerId === mc.id && hoveredCell?.sectionId === sec.id;

                                    return (
                                      <td 
                                        key={sec.id} 
                                        className="p-1 text-center"
                                        onMouseEnter={() => setHoveredCell({ markerId: mc.id, sectionId: sec.id })}
                                        onMouseLeave={() => setHoveredCell(null)}
                                      >
                                        <div 
                                          style={{ backgroundColor: mc.colorToken, opacity: 0.15 + valB * 0.85 }} 
                                          className={`py-3 px-1 rounded-xl text-[11px] leading-tight transition-all cursor-pointer font-bold ${
                                            valB > 0.45 ? 'text-slate-900' : 'text-slate-700'
                                          } ${
                                            isSelected ? 'ring-2 ring-purple-900 shadow-sm' : ''
                                          }`}
                                        >
                                          {valB.toFixed(2)}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </SoftCard>

                    </div>
                  )}

                  {/* Cell Diagnostics Tooltip-like details box */}
                  <div className="bg-slate-50 border border-slate-150/80 rounded-2xl p-4 min-h-[74px] flex items-center justify-between text-xs text-gray-650 transition-all duration-155 shadow-xs">
                    {hoveredCell ? (
                      <div className="flex items-start space-x-3 w-full">
                        <span className="text-xl shrink-0">🔬</span>
                        <div className="space-y-0.5 w-full">
                          <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                            <span>
                              Segment: <strong className="text-[var(--color-primary)]">
                                {mergedDocument.sections.find((s: any) => s.id === hoveredCell.sectionId)?.title || hoveredCell.sectionId}
                              </strong>
                            </span>
                            <span className="text-slate-400">Marker: {analysisResult.config.markerCategories.find((c: any) => c.id === hoveredCell.markerId)?.label}</span>
                          </div>
                          <div className="flex justify-between text-[10.5px] items-center text-slate-605">
                            <span>
                              Fokus A: <strong className="text-slate-800">{getAvgIntensity(analysisResult, hoveredCell.markerId, hoveredCell.sectionId).toFixed(2)}</strong> | 
                              Fokus B: <strong className="text-purple-700">{getAvgIntensity(secondaryResult, hoveredCell.markerId, hoveredCell.sectionId).toFixed(2)}</strong>
                            </span>
                            <span className="font-extrabold uppercase tracking-wide text-[9px] bg-white px-2.5 py-0.5 rounded-lg border border-gray-150 shadow-xs">
                              Verschiebung: {(getAvgIntensity(secondaryResult, hoveredCell.markerId, hoveredCell.sectionId) - getAvgIntensity(analysisResult, hoveredCell.markerId, hoveredCell.sectionId)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 text-slate-400 font-semibold text-[11px] mx-auto py-1">
                        <span>🔍 Fahre mit der Maus über die Heatmap-Zellen, um mikroanalytische Segmentdetails einzusehen.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Smart analytical synthesis on focus shifts */}
            {secondaryResult && (
              <div className="bg-[#effefd] border border-cyan-100 rounded-[32px] p-6 flex items-start space-x-4">
                <Sparkles size={20} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-cyan-900 text-xs">Hermeneutische Auswertungsnotiz</h4>
                  <p className="text-[10.5px] text-cyan-850 leading-relaxed font-semibold">
                    Der Fokuswechsel von <strong className="underline decoration-cyan-300">"{analysisResult.config.topicFocus}"</strong> hin zu <strong className="underline decoration-purple-300">"{secondaryResult.config.topicFocus}"</strong> modifiziert die paralinguistische Resonanzfrequenz. Durch das veränderte Referenzwortfeld werden Dissonanzherde und Kooperationsmarker neu kalibriert. Dies verdeutlicht, dass Kommunikation keine feste Messgröße ist, sondern durch die hermeneutische Fragestellung an Form und Dichte gewinnt.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nav Row */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <SoftButton variant="secondary" onClick={onPrev}>
          Zurück zu Analysewahl
        </SoftButton>
        <SoftButton onClick={onNext} className="shadow-md flex items-center">
          Finaler Export <ArrowRight size={15} className="ml-1" />
        </SoftButton>
      </div>
    </div>
  );
}
