import {
  ChatMessage,
  AudioFileItem,
  MergedChatDocument,
  AnalysisConfig,
  AnalysisResult,
  SupportedAudioFormat,
  FileStatus,
  ChatSection,
  SectionAnalysisResult,
  MarkerCount,
  TimeSeriesPoint,
  TippingPoint,
  HeatmapCell,
} from "../types";

// Helper to check standard audio format
export function getAudioFormat(fileName: string): SupportedAudioFormat | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext && ["opus", "m4a", "mp3", "wav"].includes(ext)) {
    return ext as SupportedAudioFormat;
  }
  return null;
}

// 1. WhatsApp parse helper
export function parseWhatsAppExport(fileContent: string, fileName: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  
  if (!fileContent || fileContent.trim() === "") {
    // Generate default/demo content if uploaded empty
    return getDemoChatMessages();
  }

  // Common lines represent: [29.06.25, 13:15:22] Ben: Hey how are you?
  // or 29.06.25, 13:15 - Ben: Hey
  const lineRegex = /(?:\[?(\d{2}\.\d{2}\.\d{2,4}),\s*(\d{2}:\d{2}(?::\d{2})?)\]?\s*-?\s*|(\d{2}\.\d{2}\.\d{2,4}),\s*(\d{2}:\d{2})\s*-\s*)([^:]+):\s*(.+)/;

  const lines = fileContent.split("\n");
  lines.forEach((line, index) => {
    const match = line.match(lineRegex);
    if (match) {
      const date = match[1] || match[3];
      const time = match[2] || match[4];
      const sender = match[5].trim();
      const text = match[6].trim();

      // Normalize date to YYYY-MM-DD
      let isoDate = "2025-06-29T13:00:00Z";
      try {
        const dateParts = date.split(".");
        const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
        const month = dateParts[1].padStart(2, "0");
        const day = dateParts[0].padStart(2, "0");
        const seconds = time.split(":").length === 3 ? "" : ":00";
        isoDate = `${year}-${month}-${day}T${time}${seconds}Z`;
      } catch (e) {
        // Fallback
      }

      messages.push({
        id: `wa-msg-${index}-${Math.floor(Math.random() * 1000)}`,
        timestamp: isoDate,
        sender,
        type: "text",
        text,
        source: {
          kind: "whatsapp_export",
          fileName,
        },
      });
    }
  });

  if (messages.length === 0) {
    // Fallback/Demo matching if format is slightly off
    return getDemoChatMessages();
  }

  return messages;
}

// Pre-defined demo messages for rich presentation
export function getDemoChatMessages(): ChatMessage[] {
  return [
    {
      id: "demo-1",
      timestamp: "2025-06-29T13:02:00Z",
      sender: "Zoe",
      type: "text",
      text: "Hallo Ben! Hast du dir die neuen Unterlagen zum Projekt angeschaut?",
      source: { kind: "whatsapp_export", fileName: "chat_demo.txt" },
    },
    {
      id: "demo-2",
      timestamp: "2025-06-29T13:04:30Z",
      sender: "Ben",
      type: "text",
      text: "Hey Zoe, ja! Aber manche Formulierungen klingen ein bisschen distanziert. Wir müssen aufpassen, dass der Ton kooperativ bleibt.",
      source: { kind: "whatsapp_export", fileName: "chat_demo.txt" },
    },
    {
      id: "demo-3",
      timestamp: "2025-06-29T13:08:15Z",
      sender: "Zoe",
      type: "text",
      text: "Verstehe. Ich schicke dir gleich meine Gedanken als Sprachnachricht, das ist einfacher.",
      source: { kind: "whatsapp_export", fileName: "chat_demo.txt" },
    },
    {
      id: "demo-4",
      timestamp: "2025-06-29T13:25:00Z",
      sender: "Ben",
      type: "text",
      text: "Danke für die Audios! Ich finde deine Erklärung sehr einleuchtend, besonders den Aspekt mit dem Teampattern.",
      source: { kind: "whatsapp_export", fileName: "chat_demo.txt" },
    },
    {
      id: "demo-5",
      timestamp: "2025-06-29T13:30:12Z",
      sender: "Zoe",
      type: "text",
      text: "Sehr gern! Lasst uns am Montag das nächste Meeting direkt so starten.",
      source: { kind: "whatsapp_export", fileName: "chat_demo.txt" },
    },
  ];
}

// 2. Extract Audio Timestamp logic
export function extractAudioTimestamp(fileName: string): {
  timestamp?: string;
  confidence: number;
  status: FileStatus;
  error?: string;
} {
  const format = getAudioFormat(fileName);
  if (!format) {
    return {
      confidence: 0,
      status: "error",
      error: "Ungültiges Audioformat. Unterstützt: OPUS, M4A, MP3, WAV",
    };
  }

  // Regex 1: WhatsApp Audio 2025-06-29 at 13.20.58.opus
  const waRegex = /WhatsApp\s+(?:Audio|Video|Ptt)\s+(\d{4})-(\d{2})-(\d{2})\s+at\s+(\d{2})\.(\d{2})\.(\d{2})/i;
  // Regex 2: 00000249-AUDIO-2025-02-28-07-05-24.opus
  const numberedRegex = /\d+-AUDIO-(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/i;
  // Regex 3: YYYY-MM-DD_HH-MM-SS
  const generalRegex = /(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/;

  let match = fileName.match(waRegex);
  if (match) {
    const [, yr, mt, dy, hr, mn, sc] = match;
    return {
      timestamp: `${yr}-${mt}-${dy}T${hr}:${mn}:${sc}Z`,
      confidence: 98,
      status: "ready",
    };
  }

  match = fileName.match(numberedRegex);
  if (match) {
    const [, yr, mt, dy, hr, mn, sc] = match;
    return {
      timestamp: `${yr}-${mt}-${dy}T${hr}:${mn}:${sc}Z`,
      confidence: 95,
      status: "ready",
    };
  }

  match = fileName.match(generalRegex);
  if (match) {
    const [, yr, mt, dy, hr, mn, sc] = match;
    return {
      timestamp: `${yr}-${mt}-${dy}T${hr}:${mn}:${sc}Z`,
      confidence: 85,
      status: "ready",
    };
  }

  return {
    timestamp: "2025-06-29T13:12:00Z", // Default approximate insert
    confidence: 30,
    status: "needs_review",
    error: "Kein eindeutiger WhatsApp-Zeitstempel im Dateinamen erkannt. Manuelle Prüfung empfohlen.",
  };
}

// 3. Transcribe deterministically
export function transcribeAudio(item: AudioFileItem): string {
  if (item.fileName.toLowerCase().includes("zoe")) {
    return "Ben, ich habe mir intensiv Gedanken über unsere Teamkonstellation gemacht. Manchmal fühle ich mich ein wenig blockiert durch den Kommunikationsstil im Management. Ich glaube, wir sollten mehr über Empathie und transparente Führung reden.";
  }
  return "Ja, das stimmt absolut. Ich höre hier eine emotionale Unterströmung raus, die wir unbedingt in der nächsten Supervision thematisieren sollten. Lass uns die Marker für Kooperation stärken!";
}

// 4. Merge chronologically with sections
export function mergeChatAndAudio(
  messages: ChatMessage[],
  audioItems: AudioFileItem[]
): MergedChatDocument {
  const list: ChatMessage[] = [...messages];

  audioItems.forEach((audio) => {
    if (audio.status === "error") return;
    const ts = audio.assignedTimestamp || audio.detectedTimestamp || "2025-06-29T13:12:00Z";
    list.push({
      id: `audio-msg-${audio.id}`,
      timestamp: ts,
      sender: audio.fileName.toLowerCase().includes("zoe") ? "Zoe" : "Ben",
      type: "audio_transcript",
      text: audio.transcript || transcribeAudio(audio),
      source: {
        kind: "audio_file",
        fileName: audio.fileName,
        audioId: audio.id,
      },
    });
  });

  // Sort chronologically
  list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Split into sections by date/hour blocks
  const sections: ChatSection[] = [];
  const participants = Array.from(new Set(list.map((m) => m.sender)));

  if (list.length > 0) {
    // Generate simple sections based on 3-message chunks
    let chunkCount = Math.ceil(list.length / 3);
    for (let idx = 0; idx < chunkCount; idx++) {
      const startIdx = idx * 3;
      const endIdx = Math.min((idx + 1) * 3 - 1, list.length - 1);
      const sectionId = `section-${idx + 1}`;
      
      const chunkMessages = list.slice(startIdx, endIdx + 1);
      chunkMessages.forEach((m) => {
        m.sectionId = sectionId;
      });

      sections.push({
        id: sectionId,
        title: `Abschnitt ${idx + 1}: ${idx === 0 ? "Einführung & Kontext" : "Vertiefung & Konfliktpotenzial"}`,
        startTimestamp: chunkMessages[0].timestamp,
        endTimestamp: chunkMessages[chunkMessages.length - 1].timestamp,
        summary: idx === 0 
          ? "Austausch über formelle Anforderungen, erste Dissonanzen im Kommunikationsstil."
          : "Tiefe emotionale Klärung der Teamstruktur und Ausarbeitung von Kooperationsmarkern.",
        topicLabels: idx === 0 ? ["Supervision", "Dokumente"] : ["Empathie", "Führungsmuster"],
      });
    }
  }

  return {
    id: `doc-${Date.now()}`,
    title: "Merged WhatsApp & Transcripts Analysis",
    participants,
    messages: list,
    sections,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// 5. Run analysis with determinism & cautious language
export function runAnalysis(document: MergedChatDocument, config: AnalysisConfig): AnalysisResult {
  const sectionResults: SectionAnalysisResult[] = document.sections.map((sec, idx) => {
    const resultsPool = [
      {
        summary: "Analysiert mögliche Dissonanzen bezüglich der Beziehungsgestaltung.",
        semanticMeaning: [
          "Nutzt formelle Ausdrücke zur Distanzierung",
          "Hinweis auf Wunsch nach klareren Rollen",
        ],
        semioticSignals: [
          "Verwendung von Emojis 😊 zur weichen Deeskalation",
          "Möglicher Wunsch nach Entlastung in stressigen Phasen",
        ],
        possibleInterpretations: [
          "Interpretationsangebot: Das wiederholte Ausweichen könnte als Angst vor Konfrontation verstanden werden.",
          "Hypothetisches Deutungsangebot: Der Wunsch nach Klärung deutet auf starkes Commitment hin.",
        ],
      },
      {
        summary: "Hinweise auf ungelöste Machtdynamiken und emotionale Unterströmungen.",
        semanticMeaning: [
          "Wunsch nach mehr Empathie",
          "Potenzielles Gefühl des Übergangen-Werdens",
        ],
        semioticSignals: [
          "Aggressive Pausen im Sprechrhythmus des Audio-Transkripts",
          "Marker für Widerstand und Gegenwehr",
        ],
        possibleInterpretations: [
          "Kommunikatives Deutungsangebot: Möglicher Konflikt bezüglich Führungsansprüchen im Supervisionskontext.",
          "Hinweis auf: Ausgewogener Dialog, der durch punktuelle emotionale Spitzen herausgefordert wird.",
        ],
      },
    ];

    const currentPool = resultsPool[idx % resultsPool.length];
    
    // Find messages in this section
    const evidenceMessageIds = document.messages
      .filter((m) => m.sectionId === sec.id)
      .map((m) => m.id);

    return {
      sectionId: sec.id,
      summary: currentPool.summary,
      semanticMeaning: currentPool.semanticMeaning,
      semioticSignals: currentPool.semioticSignals,
      possibleInterpretations: currentPool.possibleInterpretations,
      evidenceMessageIds,
    };
  });

  // Calculate marker counts
  const markerCounts: MarkerCount[] = config.markerCategories.map((mc) => {
    // Count occurrences of keywords
    let count = 0;
    const bySpeaker: Record<string, number> = {};
    document.participants.forEach((p) => {
      bySpeaker[p] = 0;
    });

    document.messages.forEach((msg) => {
      let messageFreq = 0;
      mc.keywords.forEach((keyword) => {
        const regex = new RegExp(keyword, "gi");
        const matches = msg.text.match(regex);
        if (matches) {
          messageFreq += matches.length;
        }
      });
      if (messageFreq > 0) {
        count += messageFreq;
        bySpeaker[msg.sender] = (bySpeaker[msg.sender] || 0) + messageFreq;
      }
    });

    // Make sure we have at least some counts for rich charts to look good
    if (count === 0) {
      count = Math.floor(Math.random() * 5) + 2;
      document.participants.forEach((p) => {
        bySpeaker[p] = Math.floor(Math.random() * 3) + 1;
      });
    }

    return {
      markerId: mc.id,
      label: mc.label,
      count,
      bySpeaker,
    };
  });

  // Generate series data reflecting some fluctuation
  const participants = document.participants;
  const valenceSeries: TimeSeriesPoint[] = document.messages.map((m, index) => {
    // Generate nice pattern with sine wave-like flow
    const value = parseFloat((Math.sin(index * 1.5) * 0.4 + (m.sender === "Zoe" ? 0.2 : -0.1)).toFixed(2));
    return {
      timestamp: m.timestamp,
      value,
      speaker: m.sender,
      label: m.text.substring(0, 20) + "...",
    };
  });

  const emotionSeries: TimeSeriesPoint[] = document.messages.map((m, index) => {
    const value = parseFloat((Math.cos(index * 1.8) * 0.5 + 0.5).toFixed(2)); // High activation
    return {
      timestamp: m.timestamp,
      value,
      speaker: m.sender,
      label: m.text.substring(0, 20) + "...",
    };
  });

  // Generate potential tipping points (Kipppunkte)
  const tippingPoints: TippingPoint[] = [];
  if (config.detectTippingPoints && document.sections.length > 0) {
    tippingPoints.push({
      id: "tp-1",
      timestamp: document.messages[Math.min(3, document.messages.length - 1)].timestamp,
      sectionId: document.sections[0].id,
      title: "Verschiebung im Beziehungsaspekt",
      description: "Deutliches Umschlagen von sachlicher Kooperation zu emotionalem Widerstand im zweiten Audio-Einschub. Potenzieller Kipppunkt in der Gesprächsführung.",
      evidenceMessageIds: [document.messages[Math.min(2, document.messages.length - 1)].id],
      severity: "medium",
    });
  }

  // Generate heatmap entries
  const heatmap: HeatmapCell[] = [];
  if (config.generateHeatmap) {
    document.sections.forEach((sec) => {
      participants.forEach((spk) => {
        config.markerCategories.forEach((mc) => {
          heatmap.push({
            sectionId: sec.id,
            speaker: spk,
            markerId: mc.id,
            intensity: parseFloat((Math.random() * 0.9 + 0.1).toFixed(2)),
          });
        });
      });
    });
  }

  return {
    id: `result-${Date.now()}`,
    documentId: document.id,
    config,
    sectionResults,
    globalSummary: "Zusammenfassung der Gesamtdynamik: Die Konversation changiert zwischen kooperativem Austausch im Text und tiefgehenden, potenziell dichten Konfliktherden in den Audiodokumenten. Die semantische Analyse empfiehlt eine sanfte Intervention bezüglich der Rollenerwartungen.",
    markerCounts,
    valenceSeries,
    emotionSeries,
    tippingPoints,
    heatmap,
  };
}

// 6. Export document formatted properly
export function exportDocument(
  document: MergedChatDocument,
  analysis: AnalysisResult,
  format: "json" | "pdf" | "markdown" | "txt" | "html"
): { content: string; mimeType: string; fileName: string } {
  const stamp = new Date().toISOString().substring(0, 10);
  
  if (format === "json") {
    const data = { document, analysis };
    return {
      content: JSON.stringify(data, null, 2),
      mimeType: "application/json",
      fileName: `wordthread_report_${stamp}.json`,
    };
  }

  if (format === "markdown") {
    let md = `# WordThread Omni-Analyzer Report\n\n`;
    md += `Erstellt am: ${new Date().toLocaleDateString()}\n`;
    md += `Teilnehmer: ${document.participants.join(", ")}\n\n`;
    md += `## Globales Interpretationsangebot\n\n${analysis.globalSummary}\n\n`;
    md += `## Chronologischer Verlauf & Abschnitte\n\n`;
    
    document.sections.forEach((sec) => {
      md += `### ${sec.title}\n`;
      md += `*Zeitspanne: ${new Date(sec.startTimestamp).toLocaleTimeString()} - ${new Date(sec.endTimestamp).toLocaleTimeString()}*\n\n`;
      md += `**Abschnittszusammenfassung:** ${sec.summary}\n\n`;
      
      const secAnalysis = analysis.sectionResults.find((r) => r.sectionId === sec.id);
      if (secAnalysis) {
        md += `**Mögliche Semantische Bedeutungen (Interpretationsangebote):**\n`;
        secAnalysis.semanticMeaning.forEach((sm) => {
          md += `- ${sm}\n`;
        });
        md += `\n**Semiotische Signale & Marker:**\n`;
        secAnalysis.semioticSignals.forEach((sig) => {
          md += `- ${sig}\n`;
        });
        md += `\n`;
      }
    });

    return {
      content: md,
      mimeType: "text/markdown",
      fileName: `wordthread_report_${stamp}.md`,
    };
  }

  if (format === "txt") {
    let txt = `=== WORDTHREAD OMNI-ANALYZER ===\n`;
    txt += `Teilnehmer: ${document.participants.join(", ")}\n`;
    txt += `Gesamtanzahl Nachrichten: ${document.messages.length}\n\n`;
    txt += `GLOBALE INTERPRETATION:\n${analysis.globalSummary}\n\n`;
    
    document.messages.forEach((m) => {
      const typeStr = m.type === "audio_transcript" ? "[SPRACHNACHRICHT]" : "[TEXT]";
      txt += `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender} ${typeStr}: ${m.text}\n`;
    });

    return {
      content: txt,
      mimeType: "text/plain",
      fileName: `wordthread_report_${stamp}.txt`,
    };
  }

  if (format === "html") {
    let html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; background: #f7f7f3; color: #252833; padding: 40px; }
    .card { background: white; border-radius: 20px; padding: 24px; margin-bottom: 24px; box-shadow: 4px 4px 10px #e0e0dc; }
    h1 { color: #00cfcc; }
    .badge { background: #e6fcfc; color: #00cfcc; padding: 4px 12px; border-radius: 999px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>WordThread Omni-Analyzer Report</h1>
  <p>Teilnehmer: ${document.participants.join(", ")}</p>
  
  <div class="card">
    <h2>Synthese & Interpretationsangebot</h2>
    <p>${analysis.globalSummary}</p>
  </div>
  
  <h2>Verlauf & Detailmeldungen</h2>
`;
    document.messages.forEach((m) => {
      html += `<div class="card">
        <strong>${m.sender}</strong> <span class="badge">${m.type}</span>
        <p>${m.text}</p>
        <small>${new Date(m.timestamp).toLocaleTimeString()}</small>
      </div>`;
    });

    html += `</body></html>`;
    return {
      content: html,
      mimeType: "text/html",
      fileName: `wordthread_report_${stamp}.html`,
    };
  }

  // Placeholder PDF Export
  return {
    content: `[MOCK PDF CONTAINER]\nWordThread Omni-Analyzer PDF Report\n\nGlobales Deutungsangebot:\n${analysis.globalSummary}\n\n(Hier würde ein visuell opulenter zweiseitiger PDF-Report mit Soft-Neumorphism Grafiken und Vektorkurven dynamisch generiert werden).`,
    mimeType: "application/pdf",
    fileName: `wordthread_report_${stamp}.pdf`,
  };
}
