import React, { useState } from 'react';
import { Calendar, Percent, AlertCircle, RefreshCw, ChevronRight, HelpCircle } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import SoftChip from './ui/SoftChip';
import StatusPill from './ui/StatusPill';
import { AudioFileItem, ChatMessage } from '../types';

type TimestampMappingStepProps = {
  audioItems: AudioFileItem[];
  chatMessages: ChatMessage[];
  setAudioItems: (items: AudioFileItem[]) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function TimestampMappingStep({
  audioItems,
  chatMessages,
  setAudioItems,
  onPrev,
  onNext,
}: TimestampMappingStepProps) {
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(
    audioItems.length > 0 ? audioItems[0].id : null
  );

  const selectedItem = audioItems.find(item => item.id === selectedAudioId) || audioItems[0];

  const handleTimestampChange = (id: string, newTimestamp: string) => {
    setAudioItems(
      audioItems.map(item => {
        if (item.id === id) {
          return {
            ...item,
            assignedTimestamp: newTimestamp,
            status: 'ready', // manually resolved
            confidence: 100,
          };
        }
        return item;
      })
    );
  };

  const getAdjacentMessages = (timestamp: string): ChatMessage[] => {
    if (!timestamp) return [];
    const timeVal = new Date(timestamp).getTime();
    
    // Sort chat messages by proximity
    const withProximity = chatMessages.map(msg => ({
      msg,
      diff: Math.abs(new Date(msg.timestamp).getTime() - timeVal)
    }));
    
    withProximity.sort((a, b) => a.diff - b.diff);
    // return top 3 closest
    return withProximity.slice(0, 3).map(x => x.msg).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const currentAdjacent = selectedItem 
    ? getAdjacentMessages(selectedItem.assignedTimestamp || selectedItem.detectedTimestamp || "") 
    : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Audio-Zeitstempel & Zuordnung</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">Korrigiere oder kalibriere die zeitliche Positionierung der Audionachrichten im Chat-Protokoll.</p>
        </div>
        <div className="mt-3 md:mt-0 flex space-x-2">
          <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-3 py-1 rounded-full border border-sky-100">
            {audioItems.filter(a => a.status === 'ready').length} von {audioItems.length} Memos bereit
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Audio file selector with statuses */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Audio-Dateien</h3>
          {audioItems.map((item) => {
            const isSelected = item.id === selectedAudioId;
            const currentTs = item.assignedTimestamp || item.detectedTimestamp || "";
            return (
              <SoftCard
                key={item.id}
                interactive
                active={isSelected}
                onClick={() => setSelectedAudioId(item.id)}
                className="p-4 flex justify-between items-center"
              >
                <div className="flex flex-col space-y-1.5 truncate pr-2">
                  <span className="text-sm font-bold text-[var(--color-text-primary)] truncate block">
                    {item.fileName}
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-[var(--color-text-secondary)]">
                    <Calendar size={12} />
                    <span>
                      {currentTs ? new Date(currentTs).toLocaleTimeString() : 'Unbekannt'}
                    </span>
                    {item.confidence && (
                      <span className="flex items-center text-emerald-600 font-bold ml-2">
                        <Percent size={11} className="mr-0.5" />
                        {item.confidence}%
                      </span>
                    )}
                  </div>
                </div>
                <StatusPill status={item.status} />
              </SoftCard>
            );
          })}
        </div>

        {/* Right Column: Mapping detail and adjacent lines view */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="space-y-6">
              <SoftCard className="p-6 border border-white space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Mustererkennung & Mapping</h3>
                  <span className="text-xs text-[var(--color-text-secondary)] block truncate">
                    Datei: {selectedItem.fileName}
                  </span>
                </div>

                {/* Configuration controls */}
                <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase mb-2">
                      Zugeordneter Zeitstempel (Korrektur)
                    </label>
                    <input
                      type="datetime-local"
                      value={(() => {
                        const ts = selectedItem.assignedTimestamp || selectedItem.detectedTimestamp;
                        if (!ts) return "";
                        // convert ISO string to HTML datetime-local format: YYYY-MM-DDTHH:mm
                        const d = new Date(ts);
                        const pad = (n: number) => n.toString().padStart(2, "0");
                        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                      })()}
                      onChange={(e) => {
                        if (e.target.value) {
                          const iso = new Date(e.target.value).toISOString();
                          handleTimestampChange(selectedItem.id, iso);
                        }
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-shadow"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-[var(--color-text-secondary)] flex items-center">
                      <HelpCircle size={14} className="mr-1 text-[var(--color-primary)]" />
                      Erkennungs-Konfidenz:
                    </span>
                    <span className="text-sm font-bold block text-[var(--color-text-primary)]">
                      {selectedItem.confidence || 0}%
                    </span>
                  </div>
                </div>

                {/* Insertion Proximity Preview */}
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase mb-3 tracking-wider">
                    Einfügeposition im Chat-Protokoll (Vorschau)
                  </h4>
                  {currentAdjacent.length > 0 ? (
                    <div className="space-y-3 p-4 bg-[#fbfbf8] rounded-2xl border border-dashed border-gray-200">
                      {currentAdjacent.map((msg, idx) => {
                        const isZoe = msg.sender === "Zoe";
                        return (
                          <div key={msg.id} className="text-xs space-y-1">
                            <div className="flex justify-between text-[var(--color-text-secondary)] font-medium">
                              <span className={isZoe ? "text-cyan-600" : "text-amber-600"}>{msg.sender}</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="bg-white p-2.5 rounded-xl border border-gray-100 text-[var(--color-text-primary)] italic">
                              "{msg.text}"
                            </p>
                            
                            {/* Visual insertion simulation */}
                            {idx === 0 && (
                              <div className="my-2 border-t-2 border-dashed border-[var(--color-primary)]/50 relative py-2">
                                <span className="absolute -top-2.5 left-4 bg-[#e6fcfc] text-[var(--color-primary)] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ring-1 ring-[#00cfcc]/20">
                                  Zugeordnetes Audio Memo wird hier eingefügt
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 text-center text-xs text-gray-400 rounded-2xl">
                      Keine angrenzenden Chat-Nachrichten für diesen Zeitstempel gefunden.
                    </div>
                  )}
                </div>
              </SoftCard>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-[32px] clay-card p-12 text-center text-[var(--color-text-secondary)] border border-white">
              <AlertCircle size={40} className="text-[var(--color-text-secondary)]/40 mb-3 animate-bounce" />
              <p className="text-sm font-bold">Wähle links ein Audio-Memo zur Bearbeitung aus.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-6">
        <SoftButton variant="secondary" onClick={onPrev}>
          Zurück zu Import
        </SoftButton>
        <SoftButton onClick={onNext}>
          Weiter zu Transkription & Merge
        </SoftButton>
      </div>
    </div>
  );
}
