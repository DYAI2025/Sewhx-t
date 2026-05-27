import React, { useState } from 'react';
import { Sparkles, Play, Check, Plus, Trash2, HeartHandshake, BrainCircuit, Activity, Tags, KeyRound, Columns, HelpCircle, Loader2 } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import SoftToggle from './ui/SoftToggle';
import { AnalysisConfig, MarkerCategory, AnalysisMode } from '../types';
import { apiClient } from '../lib/apiClient';

type AnalysisChoiceStepProps = {
  mergedDocument: any;
  config: AnalysisConfig;
  setConfig: (config: AnalysisConfig) => void;
  setAnalysisResult: (res: any) => void;
  onPrev: () => void;
  onNext: () => void;
};

const defaultCategories: MarkerCategory[] = [
  { id: 'mc-coop', label: 'Kooperation', keywords: ['gemeinsam', 'zusammen', 'helfen', 'unterstützen', 'kooperation', 'einig'], colorToken: '#00cfcc' },
  { id: 'mc-empathy', label: 'Empathie & Resonanz', keywords: ['fühlen', 'empathie', 'verstehen', 'resonanz', 'gefühl', 'nah'], colorToken: '#eab308' },
  { id: 'mc-conflict', label: 'Konflikt & Abgrenzung', keywords: ['grenze', 'nein', 'widerstand', 'blockiert', 'konflikt', 'schwer'], colorToken: '#f43f5e' },
];

export default function AnalysisChoiceStep({
  mergedDocument,
  config,
  setConfig,
  setAnalysisResult,
  onPrev,
  onNext
}: AnalysisChoiceStepProps) {
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>(config.mode || "semiotic_analysis");
  const [topicFocus, setTopicFocus] = useState(config.topicFocus || "Beziehungsdynamiken & Supervision");
  const [markerCategories, setMarkerCategories] = useState<MarkerCategory[]>(
    config.markerCategories.length > 0 ? config.markerCategories : defaultCategories
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Builder Temp inputs
  const [newLabel, setNewLabel] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");

  const [depth, setDepth] = useState<"fast" | "balanced" | "deep">("balanced");
  const [compareSpeakers, setCompareSpeakers] = useState(true);
  const [detectTippingPoints, setDetectTippingPoints] = useState(true);

  const modes = [
    { 
      mode: 'semiotic_analysis' as AnalysisMode, 
      title: 'Semiotisches Profil (Marker-Sense)', 
      desc: 'Sucht gezielt nach interpersonellen Mustern, de-eskalierenden Token und sprachlichen Abgrenzungen.',
      icon: <Activity className="text-[#00cfcc]" />
    },
    { 
      mode: 'relationship_analysis' as AnalysisMode, 
      title: 'Therapeutische Supervision', 
      desc: 'Analysiert emotionale Befindlichkeiten, Validierungsversuche und qualitative Teampatterns.',
      icon: <HeartHandshake className="text-pink-500" />
    },
    { 
      mode: 'deep_analysis' as AnalysisMode, 
      title: 'Tiefgehende Beziehungsanalyse', 
      desc: 'Blickt hinter das Gesagte auf unbewusste, psychodynamische Verhaltensabsichten.',
      icon: <BrainCircuit className="text-purple-500" />
    }
  ];

  const handleAddCategory = () => {
    if (!newLabel || !newKeywords) return;
    const keywords = newKeywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
    const newCat: MarkerCategory = {
      id: `mc-custom-${Date.now()}`,
      label: newLabel,
      keywords,
      colorToken: newColor
    };
    setMarkerCategories([...markerCategories, newCat]);
    setNewLabel("");
    setNewKeywords("");
  };

  const deleteCategory = (id: string) => {
    setMarkerCategories(markerCategories.filter(c => c.id !== id));
  };

  const handleRunAnalysis = async () => {
    if (!mergedDocument) return;
    setIsProcessing(true);

    const finalConfig: AnalysisConfig = {
      mode: selectedMode,
      topicFocus,
      markerCategories,
      depth,
      includeEvidenceQuotes: true,
      compareSpeakers,
      detectTippingPoints,
      generateHeatmap: true
    };
    setConfig(finalConfig);

    try {
      // Trigger calls to backend
      const result = await apiClient.runSemioticMarkerSense(mergedDocument.id, mergedDocument, finalConfig);
      setAnalysisResult(result);
      onNext();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="analysis-choice-container">
      {/* Structural layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-2">
        <div>
          <h3 className="text-lg font-black text-[var(--color-text-primary)]">Hermeneutische Analysekonfiguration</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Prüfe paralinguistische Resonanzen und erstelle ein semiotisches Rollenprofil.</p>
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-16 h-16 text-[var(--color-primary)] animate-spin" />
          <h3 className="text-lg font-black text-[var(--color-text-primary)]">Berechne hermeneutische Resonanzen...</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm text-center font-medium">
            Durchsuche Wortfelder nach semiotic-marker-sense, berechne Aktivierungsprofile und destilliere Deutungsangebote...
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left pane: choosing mode */}
        <div className="lg:col-span-7 space-y-6">
          <h4 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            Forschungsmodus auswählen
          </h4>

          <div className="space-y-4">
            {modes.map((item) => {
              const selected = item.mode === selectedMode;
              return (
                <div 
                  key={item.mode}
                  onClick={() => setSelectedMode(item.mode)}
                  className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer text-left ${
                    selected 
                      ? "bg-[#e1fbfc]/50 border-[var(--color-primary)]/40 ring-2 ring-[var(--color-primary)]/5"
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gray-50 rounded-2xl shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{item.title}</h4>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed mt-1">{item.desc}</p>
                      {selected && (
                        <span className="text-[9px] font-black text-[var(--color-primary)] uppercase flex items-center mt-2 tracking-wider">
                          <Check size={12} className="mr-1" /> Aktiviert
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Text Topic Box */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">Analytischer Themenschnittpunkt</label>
            <input
              type="text"
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              placeholder="z.B. Supervision, Führungsdynamik, Teampattern..."
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 outline-none"
            />
          </div>
        </div>

        {/* Right pane: parameter controls */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
          <h4 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Marker &amp; Toggles
          </h4>

          <SoftCard className="p-6 space-y-6">
            <h4 className="font-bold text-xs text-[var(--color-text-primary)] border-b border-gray-100 pb-2 flex items-center mb-1">
              <Plus size={15} className="text-[var(--color-primary)] mr-2" />
              Marker-Klassen anpassen
            </h4>

            {/* List of active keywords categories */}
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {markerCategories.map((mc, i) => (
                <div key={mc.id || i} className="flex justify-between items-center bg-gray-50/60 p-2.5 rounded-xl border border-gray-100 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: mc.colorToken }} />
                    <span className="font-bold text-[var(--color-text-primary)]">{mc.label}</span>
                  </div>
                  <button onClick={() => deleteCategory(mc.id)} className="text-gray-400 hover:text-rose-500 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Builder block */}
            <div className="space-y-3 pt-2 border-t border-gray-100 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text"
                  placeholder="Klasse (z.B. Sorge)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
                
                <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 overflow-hidden">
                  <span className="text-[9px] font-bold text-gray-400">Farbe:</span>
                  <input 
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-5 h-5 rounded-full outline-none border-none shrink-0 cursor-pointer"
                  />
                </div>
              </div>
              <input 
                type="text"
                placeholder="Keywords Komma-separiert: angst, bammel"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <SoftButton variant="secondary" onClick={handleAddCategory} className="w-full py-2 text-[11.5px] font-bold">
                + Kategorie hinzufügen
              </SoftButton>
            </div>

            {/* Toggles */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <SoftToggle
                checked={compareSpeakers}
                onChange={(v) => setCompareSpeakers(v)}
                label="Interaktiver Sprechervergleich"
              />
              <SoftToggle
                checked={detectTippingPoints}
                onChange={(v) => setDetectTippingPoints(v)}
                label="Kipppunkt-Detektion (Dissonanzen)"
              />
            </div>
          </SoftCard>
        </div>

      </div>

      {/* Footer Nav */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <SoftButton variant="secondary" onClick={onPrev}>
          Zurück zu Merge Preview
        </SoftButton>
        <SoftButton onClick={handleRunAnalysis} className="flex items-center space-x-2 shadow-md">
          <Play size={15} />
          <span>Analyse starten</span>
        </SoftButton>
      </div>
    </div>
  );
}
