import React, { useState, useEffect } from 'react';
import { AudioLines, MessagesSquare, RefreshCw, Edit3, Check, UserPlus, Sparkles, SlidersHorizontal, Layers, CheckCircle } from 'lucide-react';
import SoftCard from './ui/SoftCard';
import SoftButton from './ui/SoftButton';
import SoftChip from './ui/SoftChip';
import StatusPill from './ui/StatusPill';
import { AudioFileItem, ChatMessage, MergedChatDocument, ChatSection } from '../types';
import { mergeChatAndAudio, transcribeAudio } from '../lib/mockServices';

type MergePreviewStepProps = {
  audioItems: AudioFileItem[];
  chatMessages: ChatMessage[];
  setAudioItems: (items: AudioFileItem[]) => void;
  mergedDocument: MergedChatDocument | null;
  setMergedDocument: (doc: MergedChatDocument | null) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function MergePreviewStep({
  audioItems,
  chatMessages,
  setAudioItems,
  mergedDocument,
  setMergedDocument,
  onPrev,
  onNext,
}: MergePreviewStepProps) {
  const [transcribing, setTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Auto-Start Mock Transcription on step mount if any audio is queued/ready or needs review
  useEffect(() => {
    const checkNeedsTranscribe = audioItems.some(item => item.status === 'ready' || item.status === 'needs_review');
    if (checkNeedsTranscribe && !mergedDocument) {
      setTranscribing(true);
      setProgress(0);
    } else {
      // already done or no audios
      if (!mergedDocument) {
        setMergedDocument(mergeChatAndAudio(chatMessages, audioItems));
      }
    }
  }, []);

  // Transcription animation timer
  useEffect(() => {
    if (!transcribing) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTranscribing(false);
          // Complete audio transcription and merge
          const completedAudios = audioItems.map(item => ({
            ...item,
            status: 'transcribed' as const,
            transcript: item.transcript || transcribeAudio(item),
          }));
          setAudioItems(completedAudios);
          setMergedDocument(mergeChatAndAudio(chatMessages, completedAudios));
          return 100;
        }
        return prev + 25; // instant stepping simulation
      });
    }, 600);

    return () => clearInterval(interval);
  }, [transcribing]);

  // Handle speaker reassignment for a merged message
  const handleSpeakerChange = (msgId: string, newSender: string) => {
    if (!mergedDocument) return;
    const updatedMessages = mergedDocument.messages.map(m => {
      if (m.id === msgId) {
        return { ...m, sender: newSender };
      }
      return m;
    });
    setMergedDocument({
      ...mergedDocument,
      messages: updatedMessages,
      participants: Array.from(new Set(updatedMessages.map(m => m.sender)))
    });
  };

  // Handle live edit of audio transcripts
  const startEditing = (msgId: string, text: string) => {
    setEditingMessageId(msgId);
    setEditText(text);
  };

  const saveEdit = (msgId: string) => {
    if (!mergedDocument) return;
    setMergedDocument({
      ...mergedDocument,
      messages: mergedDocument.messages.map(m => {
        if (m.id === msgId) {
          return { ...m, text: editText };
        }
        return m;
      })
    });
    setEditingMessageId(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Transkription & Chronologischer Merge</h2>
        <p className="text-xs text-[var(--color-text-secondary)]">Prüfe die Transkripte und weise den Teilnehmern die korrekten Redepartnergrenzen zu.</p>
      </div>

      {/* Transcription Progress Box if running */}
      {transcribing && (
        <SoftCard className="p-8 border-cyan-100 text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <RefreshCw className="text-[var(--color-primary)] animate-spin absolute inset-0 m-auto" size={32} />
          </div>
          <h3 className="text-lg font-bold">Flüstersynthese Transkription...</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
            Whisper-Engine wandelt Audio m4a/opus Tonfrequenzen in strukturierten Fließtext um.
          </p>
          <div className="w-full max-w-md mx-auto bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
            <div 
              className="bg-[var(--color-primary)] h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[var(--color-primary)]">{progress}% abgeschlossen</span>
        </SoftCard>
      )}

      {/* Main merged document view */}
      {!transcribing && mergedDocument && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Conversation Tree/Chat Flow */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center">
              <MessagesSquare className="mr-2 text-[var(--color-primary)]" size={16} />
              Chronologischer Verlaufsmerge
            </h3>

            <div className="space-y-8">
              {mergedDocument.messages.map((msg, index) => {
                const isAudio = msg.type === "audio_transcript";
                const isZoe = msg.sender === "Zoe";
                const isEditing = editingMessageId === msg.id;

                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-start space-x-3 transition-all duration-200 ${
                      isAudio ? "bg-cyan-50/40 p-5 rounded-[28px] border border-cyan-100/50" : ""
                    }`}
                  >
                    {/* Speaker Circular Badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                      isZoe ? "bg-[#e1fbfc] text-cyan-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {msg.sender.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 space-y-1.5 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-[var(--color-text-primary)]">
                            {msg.sender}
                          </span>
                          
                          {isAudio ? (
                            <span className="inline-flex items-center text-[10px] uppercase font-black bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                              <AudioLines size={10} className="mr-1" /> Audio-Memo
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              Chatnachricht
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-[var(--color-text-secondary)]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Message Content Bubble or Editable Transcript field */}
                      <div className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                        {isEditing ? (
                          <div className="space-y-3 bg-white p-3 rounded-2xl border border-gray-200">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                              rows={3}
                            />
                            <div className="flex justify-end space-x-2">
                              <SoftButton variant="ghost" className="px-3 py-1 text-xs" onClick={() => setEditingMessageId(null)}>Abbrechen</SoftButton>
                              <SoftButton className="px-3 py-1 text-xs" onClick={() => saveEdit(msg.id)}>Speichern</SoftButton>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-3xl clay-card border border-white/40 shadow-sm relative group">
                            <p className="whitespace-pre-line text-xs font-medium">{msg.text}</p>
                            
                            {/* Inline Tools for Audio */}
                            {isAudio && (
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1.5 bg-white/90 backdrop-blur rounded-full px-2 py-1 shadow-sm border border-gray-100">
                                <button 
                                  onClick={() => startEditing(msg.id, msg.text)}
                                  className="p-1 hover:text-[var(--color-primary)] text-gray-400 font-semibold"
                                  title="Text bearbeiten"
                                >
                                  <Edit3 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Interactive metadata/speaker switch */}
                      {isAudio && (
                        <div className="flex items-center space-x-3 pt-2">
                          <span className="text-[10px] text-[var(--color-text-secondary)] flex items-center">
                            <UserPlus size={10} className="mr-1 text-[var(--color-primary)]" />
                            Sprecher:
                          </span>
                          <select
                            value={msg.sender}
                            onChange={(e) => handleSpeakerChange(msg.id, e.target.value)}
                            className="bg-white text-[10px] font-bold text-gray-600 rounded-full px-2.5 py-1 border border-gray-200 outline-none focus:border-[var(--color-primary)] cursor-pointer"
                          >
                            <option value="Zoe">Zoe</option>
                            <option value="Ben">Ben</option>
                            <option value="Unbekannt">Unbekannt</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Sections & Structure */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
            <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center">
              <Layers className="mr-2 text-[var(--color-primary)]" size={16} />
              Matrize & Abschnitte
            </h3>

            <div className="space-y-4">
              {mergedDocument.sections.map((sec, idx) => (
                <SoftCard key={sec.id} className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Themenabschnitt {idx + 1}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">
                      {new Date(sec.startTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{sec.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{sec.summary}</p>
                  
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {sec.topicLabels?.map((label) => (
                      <span key={label} className="text-[9px] bg-[#e1fbfc] text-[var(--color-primary)] font-extrabold px-2 py-0.5 rounded-full">
                        #{label}
                      </span>
                    ))}
                  </div>
                </SoftCard>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-start space-x-2.5 text-xs text-teal-800">
              <Sparkles size={16} className="text-teal-600 shrink-0 mt-0.5" />
              <p>
                Die Textstrukturen und Audio-Ankerpunkte wurden erfolgreich kalibriert. Klicke auf <strong>Merge bestätigen</strong> um das Dokument freizugeben.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-6">
        <SoftButton variant="secondary" onClick={onPrev} disabled={transcribing}>
          Zurück zu Mapping
        </SoftButton>
        <SoftButton onClick={onNext} disabled={transcribing || !mergedDocument}>
          Merge bestätigen & Weiter zur Analyse
        </SoftButton>
      </div>
    </div>
  );
}
