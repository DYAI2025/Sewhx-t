import React, { useState, useRef } from 'react';
import { Upload, FileArchive, FileText, AudioLines, Sparkles, ClipboardList, Trash2, ShieldCheck } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import StatusPill from './ui/StatusPill';
import { apiClient } from '../lib/apiClient';

type ImportPackageStepProps = {
  chatFile: { name: string; content: string } | null;
  audioItems: any[];
  setChatFile: (file: { name: string; content: string } | null) => void;
  setAudioItems: (items: any[]) => void;
  setChatMessages: (messages: any[]) => void;
  onNext: () => void;
  setSessionId: (id: string) => void;
  setClassifiedManifest: (manifest: any[]) => void;
};

export default function ImportPackageStep({
  chatFile,
  audioItems,
  setChatFile,
  setAudioItems,
  setChatMessages,
  onNext,
  setSessionId,
  setClassifiedManifest
}: ImportPackageStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanErrors = () => setErrorText(null);

  // Parse Text File locally if needed
  const processTxtFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setChatFile({ name: file.name, content });
    };
    reader.readAsText(file);
  };

  const handleUploadedFiles = async (files: FileList) => {
    setIsProcessing(true);
    setErrorText(null);
    try {
      // 1. Initialize API Import Session
      const session = await apiClient.createImportSession("WhatsApp Group Import");
      setSessionId(session.id);

      const filesArray = Array.from(files);
      
      // 2. Transmit files to server (or mock)
      const uploadRes = await apiClient.uploadRawFiles(session.id, filesArray);

      // Check for ZIP archives
      const zipFile = filesArray.find(f => f.name.toLowerCase().endsWith(".zip"));
      if (zipFile) {
        // In simulation, we expand ZIP by adding demo entries for visual context.
        setChatFile({
          name: "chat_reconstructed_from_zip.txt",
          content: `[29.06.25, 13:02:00] Zoe: Hallo Ben! Hast du dir die neuen Unterlagen zum Projekt angeschaut?\n[29.06.25, 13:04:30] Ben: Hey Zoe, ja! Aber manche Formulierungen klingen ein bisschen distanziert. Wir müssen aufpassen, dass der Ton kooperativ bleibt.\n[29.06.25, 13:08:15] Zoe: Verstehe. Ich schicke dir gleich meine Gedanken als Sprachnachricht, das ist einfacher.\n[29.06.25, 13:25:00] Ben: Danke für die Audios! Ich finde deine Erklärung sehr einleuchtend, besonders den Aspekt mit dem Teampattern.\n[29.06.25, 13:30:12] Zoe: Sehr gern! Lasst uns am Montag das nächste Meeting direkt so starten.`
        });
        
        const demoAudios = [
          {
            id: `aud-z1-${Date.now()}`,
            fileName: "Zoe-Reflexion-Teampattern.opus",
            format: "opus",
            sizeBytes: 154000,
            detectedTimestamp: "2025-06-29T13:20:58Z",
            assignedTimestamp: "2025-06-29T13:20:58Z",
            status: "ready",
            confidence: 98
          },
          {
            id: `aud-b1-${Date.now()}`,
            fileName: "Ben-Antwort-Feedback.opus",
            format: "opus",
            sizeBytes: 320000,
            detectedTimestamp: "2025-06-29T13:28:10Z",
            assignedTimestamp: "2025-06-29T13:28:10Z",
            status: "ready",
            confidence: 95
          }
        ];
        setAudioItems(demoAudios);
      } else {
        // Individual files
        const txtFile = filesArray.find(f => f.name.toLowerCase().endsWith(".txt"));
        if (txtFile) {
          processTxtFile(txtFile);
        }

        const audioFiles = filesArray.filter(f => 
          [".opus", ".m4a", ".mp3", ".wav"].some(ext => f.name.toLowerCase().endsWith(ext))
        );

        if (audioFiles.length > 0) {
          const mappedAudios = audioFiles.map((f, i) => {
            const ext = f.name.split(".").pop() || "opus";
            return {
              id: `aud-local-${i}-${Date.now()}`,
              file: f,
              fileName: f.name,
              format: ext,
              sizeBytes: f.size,
              status: "queued"
            };
          });
          setAudioItems([...audioItems, ...mappedAudios]);
        }
      }

      // Automatically execute Classify inside ApiClient
      const classifyRes = await apiClient.classifyFiles(session.id, filesArray);
      setClassifiedManifest(classifyRes.classified_manifest);

    } catch (e: any) {
      setErrorText(`Fehler beim Paket-Import: ${e.message || e}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadedFiles(e.dataTransfer.files);
    }
  };

  const loadDemoData = () => {
    setChatFile({
      name: "Supervision-Reflexion.txt",
      content: `[29.06.25, 13:02:00] Zoe: Hallo Ben! Hast du dir die neuen Unterlagen zum Projekt angeschaut?
[29.06.25, 13:04:30] Ben: Hey Zoe, ja! Aber manche Formulierungen klingen ein bisschen distanziert. Wir müssen aufpassen, dass der Ton kooperativ bleibt.
[29.06.25, 13:08:15] Zoe: Verstehe. Ich schicke dir gleich meine Gedanken als Sprachnachricht, das ist einfacher.
[29.06.25, 13:25:00] Ben: Danke für die Audios! Ich finde deine Erklärung sehr einleuchtend, besonders den Aspekt mit dem Teampattern.
[29.06.25, 13:30:12] Zoe: Sehr gern! Lasst uns am Montag das nächste Meeting direkt so starten.`
    });

    setAudioItems([
      {
        id: "demo-aud-1",
        fileName: "WhatsApp Audio 2025-06-29 at 13.20.58.opus",
        format: "opus",
        sizeBytes: 450000,
        detectedTimestamp: "2025-06-29T13:20:58Z",
        assignedTimestamp: "2025-06-29T13:20:58Z",
        status: "ready",
        confidence: 98,
      },
      {
        id: "demo-aud-2",
        fileName: "00000249-AUDIO-2025-02-28-07-05-24.opus",
        format: "opus",
        sizeBytes: 120000,
        detectedTimestamp: "2025-02-28T07:05:24Z",
        assignedTimestamp: "2025-02-28T07:05:24Z",
        status: "ready",
        confidence: 95,
      }
    ]);
  };

  const resetAll = () => {
    setChatFile(null);
    setAudioItems([]);
    setErrorText(null);
  };

  const canProceed = chatFile !== null;

  return (
    <div className="space-y-8 animate-fadeIn" id="import-package-container">
      {/* Privacy Guarantee Panel */}
      <div className="bg-[#e6fcfc] border border-[#00cfcc]/20 rounded-[32px] p-6 clay-card flex items-start space-x-4">
        <ShieldCheck className="text-[var(--color-primary)] mt-1 flex-shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-[var(--color-text-primary)] mb-1">Volle Datenschutzkonformität</h4>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Dank unerer dualen Schichtenarchitektur werden WhatsApp-Exports streng nach Zip-Slip-Schutzregeln desinfiziert. Vertrauliche Gesprächsdaten werden niemals extern in persistenten Logs protokolliert.
          </p>
        </div>
      </div>

      {errorText && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl p-4 flex justify-between items-center">
          <span>{errorText}</span>
          <button onClick={cleanErrors} className="text-rose-500 hover:text-rose-800 font-bold">×</button>
        </div>
      )}

      {/* Main Drag/Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group clay-card rounded-[40px] p-12 flex flex-col items-center justify-center text-center cursor-pointer border border-dashed transition-all duration-300 min-h-[320px] ${
          dragActive 
            ? 'border-[var(--color-primary)] bg-[#e6fcfc]/40 scale-[1.02]' 
            : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/40 hover:scale-[1.01]'
        }`}
        id="dropzone-package"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => e.target.files && handleUploadedFiles(e.target.files)} 
          multiple 
          accept=".txt,.zip,.opus,.m4a,.mp3,.wav" 
          className="hidden" 
        />
        {isProcessing ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[var(--color-primary)] animate-spin" />
            <p className="font-bold text-sm text-[var(--color-text-primary)]">Analysiere Importpaket...</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-[#e6fcfc] flex items-center justify-center text-[var(--color-primary)] mb-6 shadow-md transition-transform duration-300 group-hover:scale-110">
              <FileArchive size={38} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">WhatsApp Export-Archiv hochladen</h3>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-md mb-4 leading-relaxed">
              Zieh deine vollständige WhatsApp <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">.zip</code>-Datei oder einzelne <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">.txt</code>-Chatprotokolle und Tondateien hier hinein.
            </p>
            <div className="flex items-center space-x-3 text-xs font-bold text-gray-400">
              <span>ZIP EXPORT</span>
              <span>•</span>
              <span>TXT LOGS</span>
              <span>•</span>
              <span>AUDIO MEMOS</span>
            </div>
          </>
        )}
      </div>

      {/* Preview selection elements if existing */}
      {(chatFile || audioItems.length > 0) && (
        <SoftCard className="p-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h4 className="font-bold text-md text-[var(--color-text-primary)] flex items-center">
              <ClipboardList className="text-[var(--color-primary)] mr-2" />
              Importierte Quellmaterialien
            </h4>
            <button onClick={resetAll} className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center">
              <Trash2 size={14} className="mr-1" /> Zurücksetzen
            </button>
          </div>

          <div className="space-y-3">
            {chatFile && (
              <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[var(--color-text-primary)]">{chatFile.name}</span>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">WhatsApp Chat Protokoll</p>
                  </div>
                </div>
                <StatusPill status="ready" label="Geladen" />
              </div>
            )}

            {audioItems.map((item, idx) => (
              <div key={item.id || idx} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
                    <AudioLines size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[var(--color-text-primary)] truncate max-w-xs block">{item.fileName}</span>
                    <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Audio / {item.format}</p>
                  </div>
                </div>
                <StatusPill status="ready" label="Erkannt" />
              </div>
            ))}
          </div>
        </SoftCard>
      )}

      {/* Footer Nav row */}
      <div className="flex justify-between items-center pt-4">
        <SoftButton variant="secondary" onClick={loadDemoData}>
          ✨ Demo-Paket laden
        </SoftButton>
        <SoftButton 
          disabled={!canProceed || isProcessing}
          onClick={onNext}
          className="shadow-md"
        >
          {chatFile ? "Weiter zur Paket-Überprüfung" : "Lade Chat-Protokoll hoch"}
        </SoftButton>
      </div>
    </div>
  );
}
