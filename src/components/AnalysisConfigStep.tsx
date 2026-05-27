import React, { useState } from 'react';
import { Sparkles, Play, Check, Plus, Trash2, HeartHandshake, BrainCircuit, Activity, Tags, KeyRound, Columns, HelpCircle } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import SoftChip from './ui/SoftChip';
import SoftToggle from './ui/SoftToggle';
import { AnalysisConfig, MarkerCategory, AnalysisMode } from '../types';

type AnalysisConfigStepProps = {
  config: AnalysisConfig;
  setConfig: (config: AnalysisConfig) => void;
  onPrev: () => void;
  onNext: () => void;
};

// Initial default marker categories matching the standard colors
const defaultCategories: MarkerCategory[] = [
  { id: 'mc-coop', label: 'Kooperation', keywords: ['gemeinsam', 'zusammen', 'helfen', 'unterstützen', 'kooperation', 'einig'], colorToken: '#00cfcc' },
  { id: 'mc-empathy', label: 'Empathie & Resonanz', keywords: ['fühlen', 'empathie', 'verstehen', 'resonanz', 'gefühl', 'nah'], colorToken: '#eab308' },
  { id: 'mc-conflict', label: 'Konflikt & Abgrenzung', keywords: ['grenze', 'nein', 'widerstand', 'blockiert', 'konflikt', 'schwer'], colorToken: '#f43f5e' },
];

export default function AnalysisConfigStep({
  config,
  setConfig,
  onPrev,
  onNext,
}: AnalysisConfigStepProps) {
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>(config.mode);
  const [topicFocus, setTopicFocus] = useState(config.topicFocus);
  const [markerCategories, setMarkerCategories] = useState<MarkerCategory[]>(
    config.markerCategories.length > 0 ? config.markerCategories : defaultCategories
  );
  
  // Builder Temp Fields
  const [newMarkerLabel, setNewMarkerLabel] = useState("");
  const [newMarkerKeywords, setNewMarkerKeywords] = useState("");
  const [newMarkerColor, setNewMarkerColor] = useState("#8b5cf6");

  // Mode descriptions & Icons
  const modes: { mode: AnalysisMode; title: string; desc: string; icon: React.ReactNode }[] = [
    { 
      mode: 'relationship_analysis', 
      title: 'Beziehungsanalyse', 
      desc: 'Analysiert interpersonelle Nähe, Validierungsversuche und Distanzierungen.',
      icon: <HeartHandshake className="text-[#00cfcc]" />
    },
    { 
      mode: 'deep_analysis', 
      title: 'Deep Analysis', 
      desc: 'Blickt hinter das Gesagte auf unbewusste, psychodynamische Abwehrmechanismen.',
      icon: <BrainCircuit className="text-purple-500" />
    },
    { 
      mode: 'semiotic_analysis', 
      title: 'Semiotische Analyse', 
      desc: 'Überprüft syntaktische Details, Sprechpausen und Emoji-Gebrauch als psychologische Indikatoren.',
      icon: <Activity className="text-pink-500" />
    },
    { 
      mode: 'semantic_analysis', 
      title: 'Semantische Analyse', 
      desc: 'Gewichtet Wortfelder und sucht nach verborgenen Meta-Botschaften.',
      icon: <Tags className="text-orange-500" />
    },
    { 
      mode: 'emotion_dynamics', 
      title: 'Emotionsdynamik', 
      desc: 'Zeigt emotionale Ausreißer und verdeckte Spannungsverläufe.',
      icon: <Sparkles className="text-amber-500" />
    },
    { 
      mode: 'marker_count', 
      title: 'Markerzählung', 
      desc: 'Erfasst die reine quantitative Frequenz deiner definierten Kategorien.',
      icon: <KeyRound className="text-emerald-500" />
    },
  ];

  const handleAddMarkerCategory = () => {
    if (!newMarkerLabel || !newMarkerKeywords) return;
    const keywords = newMarkerKeywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
    const newCat: MarkerCategory = {
      id: `mc-custom-${Date.now()}`,
      label: newMarkerLabel,
      keywords,
      colorToken: newMarkerColor,
    };
    setMarkerCategories([...markerCategories, newCat]);
    setNewMarkerLabel("");
    setNewMarkerKeywords("");
  };

  const handleRemoveCategory = (id: string) => {
    setMarkerCategories(markerCategories.filter(mc => mc.id !== id));
  };

  const handleStartAnalysis = () => {
    setConfig({
      ...config,
      mode: selectedMode,
      topicFocus,
      markerCategories,
    });
    onNext();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Analyse-Konfiguration</h2>
        <p className="text-xs text-[var(--color-text-secondary)]">Konfiguriere den thematischen Fokus und die parametrischen Marker für die psychodynamische Synthese.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Mode choosing layout */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            Analysemodus auswählen
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modes.map((item) => {
              const isSelected = item.mode === selectedMode;
              return (
                <SoftCard
                  key={item.mode}
                  interactive
                  active={isSelected}
                  onClick={() => setSelectedMode(item.mode)}
                  className="p-5 flex flex-col justify-between space-y-4 text-left border border-white/60 h-full"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shadow-inner">
                      {item.icon}
                    </div>
                    <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{item.title}</h4>
                    <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] font-black text-[var(--color-primary)] uppercase flex items-center">
                      <Check size={12} className="mr-1" /> Aktiviert
                    </span>
                  )}
                </SoftCard>
              );
            })}
          </div>

          {/* Freitext Themenfokus */}
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-[var(--color-text-secondary)]">Thematischer Fokus / Freitext-Abfrage</label>
            <input
              type="text"
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              placeholder="z.B. Supervision, Machtdynamik, Führungsrollen, Empathie..."
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all outline-none"
            />
            {/* Quick chips helper */}
            <div className="flex flex-wrap gap-2 pt-1">
              {["Supervision", "Managementkonflikt", "Grenzziehung", "Kooperationsstil"].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setTopicFocus(chip)}
                  className="text-[10px] font-bold text-gray-500 bg-white border border-gray-100 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors"
                >
                  +{chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Toggle controls & custom marker builder */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Analyseparameter & Marker Builder
          </h3>

          <SoftCard className="p-6 space-y-6">
            <h4 className="font-bold text-sm text-[var(--color-text-primary)] border-b border-gray-50 pb-2 flex items-center">
              <Plus size={16} className="text-[var(--color-primary)] mr-2" />
              Marker-Kategorien customisieren
            </h4>

            {/* List of categories */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {markerCategories.map((mc) => (
                <div key={mc.id} className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: mc.colorToken }} />
                    <span className="font-bold text-[var(--color-text-primary)]">{mc.label}</span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] truncate max-w-[120px]">
                      ({mc.keywords.join(", ")})
                    </span>
                  </div>
                  <button 
                    onClick={() => handleRemoveCategory(mc.id)}
                    className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Builder inputs */}
            <div className="space-y-3 pt-2 border-t border-gray-50">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Kategoriename (z.B. Angst)"
                  value={newMarkerLabel}
                  onChange={(e) => setNewMarkerLabel(e.target.value)}
                  className="bg-white border border-gray-150 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
                
                {/* Color Selector */}
                <div className="flex items-center space-x-2 bg-white border border-gray-150 rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-bold text-gray-400">Farbe:</span>
                  <input
                    type="color"
                    value={newMarkerColor}
                    onChange={(e) => setNewMarkerColor(e.target.value)}
                    className="w-5 h-5 rounded-full ring-1 ring-gray-100 border-none cursor-pointer outline-none shrink-0"
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="Keywords Komma-separiert: sorge, angst, bammel"
                value={newMarkerKeywords}
                onChange={(e) => setNewMarkerKeywords(e.target.value)}
                className="w-full bg-white border border-gray-150 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />

              <SoftButton variant="secondary" onClick={handleAddMarkerCategory} className="w-full py-2 text-xs">
                + Kategorie hinzufügen
              </SoftButton>
            </div>

            {/* Depth options slider */}
            <div className="space-y-2 pt-4 border-t border-gray-50">
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase block">
                Analysetiefe (Dauer / Detailgrad)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['fast', 'balanced', 'deep'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setConfig({ ...config, depth: d as "fast" | "balanced" | "deep" })}
                    className={`py-2 rounded-xl text-xs font-black transition-colors ${
                      config.depth === d 
                        ? 'bg-[var(--color-primary)] text-white' 
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {d === 'fast' ? 'Schnell' : d === 'balanced' ? 'Ausgewogen' : 'Tief (AI)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4 pt-4 border-t border-gray-50">
              <SoftToggle
                checked={config.compareSpeakers}
                onChange={(v) => setConfig({ ...config, compareSpeakers: v })}
                label="Interaktiver Sprechervergleich"
              />
              <SoftToggle
                checked={config.detectTippingPoints}
                onChange={(v) => setConfig({ ...config, detectTippingPoints: v })}
                label="Kipppunkt-Detektion (Dissonanzen)"
              />
              <SoftToggle
                checked={config.generateHeatmap}
                onChange={(v) => setConfig({ ...config, generateHeatmap: v })}
                label="Semiotische Heatmap erstellen"
              />
            </div>
          </SoftCard>
        </div>

      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6">
        <SoftButton variant="secondary" onClick={onPrev}>
          Zurück zu Merge Preview
        </SoftButton>
        <SoftButton onClick={handleStartAnalysis} className="flex items-center space-x-2">
          <Play size={16} />
          <span>Synthese-Analyse starten</span>
        </SoftButton>
      </div>
    </div>
  );
}
