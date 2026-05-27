import React, { useState } from 'react';
import { Upload, FileText, AudioLines, FileUp, ClipboardList, Trash2, CheckCircle2 } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import StatusPill from './ui/StatusPill';
import { parseWhatsAppExport, getAudioFormat, extractAudioTimestamp } from '../lib/mockServices';
import { ChatMessage, AudioFileItem } from '../types';

type ImportStepProps = {
  chatFile: { name: string; content: string } | null;
  audioItems: AudioFileItem[];
  setChatFile: (file: { name: string; content: string } | null) => void;
  setAudioItems: (items: AudioFileItem[]) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  onNext: () => void;
};

export default function ImportStep({
  chatFile,
  audioItems,
  setChatFile,
  setAudioItems,
  setChatMessages,
  onNext,
}: ImportStepProps) {
  const [dragWa, setDragWa] = useState(false);
  const [dragAudio, setDragAudio] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // File Picker Refs
  const waInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);

  const cleanErrors = () => setErrorText(null);

  // Parse Text File helper
  const handleWaFile = (file: File) => {
    if (!file.name.endsWith('.txt')) {
      setErrorText("Ungültiges Format für Chat-Export. Bitte lade eine '.txt' Datei hoch.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setChatFile({ name: file.name, content });
      const parsed = parseWhatsAppExport(content, file.name);
      setChatMessages(parsed);
      setErrorText(null);
    };
    reader.readAsText(file);
  };

  // Add Audio File helper
  const handleAudioFiles = (files: FileList) => {
    const newItems: AudioFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const format = getAudioFormat(file.name);
      
      if (!format) {
        newItems.push({
          id: `audio-${Date.now()}-${i}`,
          fileName: file.name,
          format: 'opus', // fallback
          sizeBytes: file.size,
          status: 'error',
          error: `Ungültiges Format: ${file.name.split('.').pop() || 'unbekannt'}. Nur OPUS, M4A, MP3, WAV erlaubt.`,
        });
      } else {
        const metadata = extractAudioTimestamp(file.name);
        newItems.push({
          id: `audio-${Date.now()}-${i}`,
          file,
          fileName: file.name,
          format,
          sizeBytes: file.size,
          detectedTimestamp: metadata.timestamp,
          status: metadata.status,
          confidence: metadata.confidence,
          error: metadata.error,
        });
      }
    }
    setAudioItems([...audioItems, ...newItems]);
    setErrorText(null);
  };

  // Loading High Quality Mock Demo Data
  const loadDemoData = () => {
    // Loaded 1 WhatsApp Chat with 5 messages
    const demoContent = `[29.06.25, 13:02:00] Zoe: Hallo Ben! Hast du dir die neuen Unterlagen zum Projekt angeschaut?
[29.06.25, 13:04:30] Ben: Hey Zoe, ja! Aber manche Formulierungen klingen ein bisschen distanziert. Wir müssen aufpassen, dass der Ton kooperativ bleibt.
[29.06.25, 13:08:15] Zoe: Verstehe. Ich schicke dir gleich meine Gedanken als Sprachnachricht, das ist einfacher.
[29.06.25, 13:25:00] Ben: Danke für die Audios! Ich finde deine Erklärung sehr einleuchtend, besonders den Aspekt mit dem Teampattern.
[29.06.25, 13:30:12] Zoe: Sehr gern! Lasst uns am Montag das nächste Meeting direkt so starten.`;
    
    setChatFile({ name: "WhatsApp Chat - Projektreflexion.txt", content: demoContent });
    setChatMessages(parseWhatsAppExport(demoContent, "WhatsApp Chat - Projektreflexion.txt"));

    const demoAudios: AudioFileItem[] = [
      {
        id: "demo-aud-1",
        fileName: "WhatsApp Audio 2025-06-29 at 13.20.58.opus",
        format: "opus",
        sizeBytes: 450000,
        detectedTimestamp: "2025-06-29T13:20:58Z",
        status: "ready",
        confidence: 98,
      },
      {
        id: "demo-aud-2",
        fileName: "00000249-AUDIO-2025-02-28-07-05-24.opus",
        format: "opus",
        sizeBytes: 120000,
        detectedTimestamp: "2025-02-28T07:05:24Z",
        status: "ready",
        confidence: 95,
      },
      {
        id: "demo-aud-3",
        fileName: "Unsortiertes-Audio-Meeting.mp3",
        format: "mp3",
        sizeBytes: 890000,
        detectedTimestamp: "2025-06-29T13:12:00Z",
        status: "needs_review",
        confidence: 30,
        error: "Kein WhatsApp-Zeitstempel im Namen. Manuelle Prüfung empfohlen.",
      }
    ];
    setAudioItems(demoAudios);
    setErrorText(null);
  };

  const removeAudioItem = (id: string) => {
    setAudioItems(audioItems.filter(item => item.id !== id));
  };

  const resetChatFile = () => {
    setChatFile(null);
    setChatMessages([]);
  };

  // Drag 'n Drop callbacks
  const onDragOverWa = (e: React.DragEvent) => {
    e.preventDefault();
    setDragWa(true);
  };
  const onDragLeaveWa = () => setDragWa(false);
  const onDropWa = (e: React.DragEvent) => {
    e.preventDefault();
    setDragWa(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleWaFile(e.dataTransfer.files[0]);
    }
  };

  const onDragOverAudio = (e: React.DragEvent) => {
    e.preventDefault();
    setDragAudio(true);
  };
  const onDragLeaveAudio = () => setDragAudio(false);
  const onDropAudio = (e: React.DragEvent) => {
    e.preventDefault();
    setDragAudio(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAudioFiles(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const hasTranscriptsToMap = chatFile !== null && audioItems.length > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner info */}
      <div className="bg-[#e6fcfc] border border-[#00cfcc]/20 rounded-[32px] p-6 clay-card flex items-start space-x-4">
        <CheckCircle2 className="text-[var(--color-primary)] mt-1 flex-shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-[var(--color-text-primary)] mb-1">Lokale Datenhoheit garantiert</h4>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Keine Daten verlassen dein Gerät. Der gesamte Prozess von WhatsApp Parsing, Audio-Musteranalyse und Visualisierungs-Rendering erfolgt vollständig offline und lokal in dieser interaktiven Client Sandbox.
          </p>
        </div>
      </div>

      {errorText && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl p-4 flex justify-between items-center">
          <span>{errorText}</span>
          <button onClick={cleanErrors} className="text-rose-500 hover:text-rose-800 font-bold">×</button>
        </div>
      )}

      {/* Upload Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* WhatsApp file upload */}
        <div
          onDragOver={onDragOverWa}
          onDragLeave={onDragLeaveWa}
          onDrop={onDropWa}
          onClick={() => waInputRef.current?.click()}
          className={`group clay-card rounded-[40px] p-10 flex flex-col items-center justify-center text-center cursor-pointer border border-dashed transition-all duration-300 min-h-[280px] ${
            dragWa 
              ? 'border-[var(--color-primary)] bg-[#e6fcfc]/40 scale-[1.02]' 
              : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/40 hover:scale-[1.01]'
          }`}
        >
          <input 
            type="file" 
            ref={waInputRef} 
            onChange={(e) => e.target.files?.[0] && handleWaFile(e.target.files[0])} 
            accept=".txt" 
            className="hidden" 
          />
          <div className="w-16 h-16 rounded-full bg-[#e6fcfc] flex items-center justify-center text-[var(--color-primary)] mb-6 shadow-inner transition-transform duration-300 group-hover:scale-110">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">WhatsApp Chat-Export</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-[280px] mb-4">
            Zieh die exportierte <code className="bg-gray-100 px-1.5 py-0.5 rounded">.txt</code>-Datei hinein oder klicke zum Auswählen.
          </p>
          <StatusPill status={chatFile ? "ready" : "needs_review"} label={chatFile ? "Hochgeladen" : "Warte auf Datei"} />
        </div>

        {/* Audio file uploads */}
        <div
          onDragOver={onDragOverAudio}
          onDragLeave={onDragLeaveAudio}
          onDrop={onDropAudio}
          onClick={() => audioInputRef.current?.click()}
          className={`group clay-card rounded-[40px] p-10 flex flex-col items-center justify-center text-center cursor-pointer border border-dashed transition-all duration-300 min-h-[280px] ${
            dragAudio 
              ? 'border-[var(--color-primary)] bg-[#e6fcfc]/40 scale-[1.02]' 
              : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/40 hover:scale-[1.01]'
          }`}
        >
          <input 
            type="file" 
            ref={audioInputRef} 
            onChange={(e) => e.target.files && handleAudioFiles(e.target.files)} 
            multiple 
            accept=".opus,.m4a,.mp3,.wav" 
            className="hidden" 
          />
          <div className="w-16 h-16 rounded-full bg-[#e6fcfc] flex items-center justify-center text-[var(--color-primary)] mb-6 shadow-inner transition-transform duration-300 group-hover:scale-110">
            <AudioLines size={32} />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Audio-Memos hochladen</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-[280px] mb-4">
            Wähle eine oder mehrere WhatsApp Audio-Aufnahmen im Format <strong className="font-semibold text-gray-600">OPUS, M4A, MP3, WAV</strong>.
          </p>
          <StatusPill status={audioItems.length > 0 ? "transcribed" : "needs_review"} label={audioItems.length > 0 ? `${audioItems.length} Memos` : "Noch keine Memos"} />
        </div>
      </div>

      {/* Loaded Files Preview Section */}
      {(chatFile || audioItems.length > 0) && (
        <SoftCard className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center">
              <ClipboardList className="text-[var(--color-primary)] mr-2" />
              Geladene Import-Elemente
            </h3>
            <SoftButton variant="ghost" onClick={loadDemoData} className="text-xs hover:text-[var(--color-primary)]">
              Demo-Daten zurücksetzten/neu laden
            </SoftButton>
          </div>

          <div className="space-y-4">
            {chatFile && (
              <div className="flex justify-between items-center bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{chatFile.name}</h4>
                    <span className="text-xs text-[var(--color-text-secondary)]">WhatsApp Text Protokoll</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); resetChatFile(); }}
                  className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {audioItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-cyan-50 text-cyan-500 rounded-xl">
                    <AudioLines size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-text-primary)] truncate max-w-xs md:max-w-md">{item.fileName}</h4>
                    <div className="flex items-center space-x-3 mt-0.5">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{item.format}</span>
                      <span className="text-[10px] text-[var(--color-text-secondary)]">{formatSize(item.sizeBytes)}</span>
                      {item.detectedTimestamp && (
                        <span className="text-[10px] text-emerald-600 font-medium">Auto-Zeitstempel: ja</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <StatusPill status={item.status} />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeAudioItem(item.id); }}
                    className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SoftCard>
      )}

      {/* Call to Actions */}
      <div className="flex justify-between items-center mt-8">
        <SoftButton variant="secondary" onClick={loadDemoData}>
          ✨ Volle Demo-Daten laden
        </SoftButton>
        <SoftButton 
          disabled={!hasTranscriptsToMap}
          onClick={onNext}
          className="shadow-md"
        >
          {chatFile ? (audioItems.length > 0 ? "Weiter zur Timestamp-Zuordnung" : "Lade mind. ein Audio Memo") : "Bitte Chat-Export hochladen"}
        </SoftButton>
      </div>
    </div>
  );
}
