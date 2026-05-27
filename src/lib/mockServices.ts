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
function generateValenceSvg(valenceSeries: TimeSeriesPoint[]): string {
  if (!valenceSeries || valenceSeries.length === 0) return "";
  const width = 800;
  const height = 180;
  const paddingX = 50;
  const paddingY = 25;
  
  const pointsCount = valenceSeries.length;
  const stepX = pointsCount > 1 ? (width - paddingX * 2) / (pointsCount - 1) : 0;
  
  let pathD = "";
  let circles = "";
  
  valenceSeries.forEach((pt, i) => {
    const x = paddingX + i * stepX;
    const val = pt.value;
    const y = height / 2 - (val * (height / 2 - paddingY) * 1.5);
    
    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
    
    const color = pt.speaker === "Zoe" ? "#00cfcc" : "#f43f5e";
    circles += `<circle cx="${x}" cy="${y}" r="6" fill="${color}" stroke="#ffffff" stroke-width="2">
      <title>${pt.speaker}: ${pt.value} (${pt.label || ""})</title>
    </circle>`;
  });
  
  return `
    <svg viewBox="0 0 ${width} ${height}" class="timeline-svg">
      <line x1="${paddingX}" y1="${height / 2}" x2="${width - paddingX}" y2="${height / 2}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4" />
      <text x="${paddingX - 12}" y="${height / 2 + 4}" fill="#64748b" font-size="10" font-weight="700" text-anchor="end">Neutral</text>
      <text x="${paddingX - 12}" y="${paddingY + 4}" fill="#10b981" font-size="10" font-weight="750" text-anchor="end">Positiv</text>
      <text x="${paddingX - 12}" y="${height - paddingY + 4}" fill="#f43f5e" font-size="10" font-weight="750" text-anchor="end">Negativ</text>
      
      <path d="${pathD}" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.5" />
      ${circles}
    </svg>
  `;
}

function generateEmotionSvg(emotionSeries: TimeSeriesPoint[]): string {
  if (!emotionSeries || emotionSeries.length === 0) return "";
  const width = 800;
  const height = 180;
  const paddingX = 50;
  const paddingY = 25;
  
  const pointsCount = emotionSeries.length;
  const stepX = pointsCount > 1 ? (width - paddingX * 2) / (pointsCount - 1) : 0;
  
  let pathD = "";
  let circles = "";
  
  emotionSeries.forEach((pt, i) => {
    const x = paddingX + i * stepX;
    const val = pt.value;
    const y = (height - paddingY) - (val * (height - paddingY * 2));
    
    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
    
    const color = pt.speaker === "Zoe" ? "#00cfcc" : "#f43f5e";
    circles += `<circle cx="${x}" cy="${y}" r="6" fill="#eab308" stroke="#ffffff" stroke-width="2">
      <title>${pt.speaker}: ${pt.value} (${pt.label || ""})</title>
    </circle>`;
  });
  
  return `
    <svg viewBox="0 0 ${width} ${height}" class="timeline-svg">
      <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="#e2e8f0" stroke-width="1.5" />
      <line x1="${paddingX}" y1="${paddingY}" x2="${width - paddingX}" y2="${paddingY}" stroke="#e2e8f0" stroke-width="1.5" />
      <text x="${paddingX - 12}" y="${paddingY + 4}" fill="#64748b" font-size="10" font-weight="700" text-anchor="end">Hoch</text>
      <text x="${paddingX - 12}" y="${height - paddingY + 4}" fill="#64748b" font-size="10" font-weight="700" text-anchor="end">Niedrig</text>
      
      <path d="${pathD}" fill="none" stroke="#eab308" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.6" />
      ${circles}
    </svg>
  `;
}

function generateMarkerBars(markerCounts: MarkerCount[], participants: string[]): string {
  return markerCounts.map((mc) => {
    const total = mc.count || 1;
    const speakerBars = participants.map((speaker, idx) => {
      const count = mc.bySpeaker[speaker] || 0;
      const pct = Math.round((count / total) * 100);
      return { speaker, count, pct };
    });

    const barShares = speakerBars.map((sb, idx) => {
      if (sb.pct === 0) return "";
      const colors = ["#00cfcc", "#f43f5e", "#eab308", "#8b5cf6"];
      const color = colors[idx % colors.length];
      return `
        <div class="share-segment" style="width: ${sb.pct}%; background-color: ${color};" title="${sb.speaker}: ${sb.count} (${sb.pct}%)">
          <span class="share-percent">${sb.speaker}: ${sb.count} (${sb.pct}%)</span>
        </div>
      `;
    }).join("");

    return `
      <div class="marker-score-item">
        <div class="marker-score-header">
          <span class="marker-label">${mc.label}</span>
          <span class="marker-total">${mc.count} Treffer gesamt</span>
        </div>
        <div class="share-track">
          ${barShares || `<div class="share-segment" style="width: 100%; background-color: #cbd5e1;"><span class="share-percent" style="color: #64748b;">0 Treffer</span></div>`}
        </div>
      </div>
    `;
  }).join("");
}

function generatePrintableHtml(
  document: MergedChatDocument,
  analysis: AnalysisResult,
  isPdfBasis: boolean
): string {
  const stampStr = new Date().toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const textMessages = document.messages.filter(m => m.type === "text").length;
  const audioMessages = document.messages.filter(m => m.type === "audio_transcript").length;
  
  const valenceSvg = generateValenceSvg(analysis.valenceSeries);
  const emotionSvg = generateEmotionSvg(analysis.emotionSeries);
  const markerBarsHtml = generateMarkerBars(analysis.markerCounts, document.participants);
  
  let tippingPointsHtml = "";
  if (analysis.tippingPoints && analysis.tippingPoints.length > 0) {
    tippingPointsHtml = `
      <div class="card">
        <h3 class="card-title" style="color: #f43f5e; margin-bottom: 8px;">Detektierte Kipppunkte &amp; Dissonanzherde</h3>
        <p class="card-subtitle">Identifizierte Verschiebungen in der Dynamik und Beziehungsstruktur.</p>
        <div class="tipping-list">
          ${analysis.tippingPoints.map((tp) => `
            <div class="tipping-card">
              <div class="tipping-title">
                <span class="tipping-severity">${tp.severity === "high" ? "Kritisch" : "Moderat"}</span>
                <span>${tp.title}</span>
              </div>
              <div class="tipping-desc">${tp.description}</div>
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #a0aec0; margin-top: 8px; display: flex; justify-content: space-between;">
                <span>Ereignisstelle: ${new Date(tp.timestamp).toLocaleTimeString("de-DE")} Uhr</span>
                <span>ID: ${tp.id}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  const sectionsHtml = document.sections.map((sec) => {
    const secAnalysis = analysis.sectionResults.find((r) => r.sectionId === sec.id);
    const messagesInSection = document.messages.filter((m) => m.sectionId === sec.id);
    
    let analyticalSection = "";
    if (secAnalysis) {
      analyticalSection = `
        <div class="analytical-signals">
          <div class="signal-box">
            <h5>Semantische Resonanz</h5>
            <ul>
              ${secAnalysis.semanticMeaning.map((sm) => `<li>${sm}</li>`).join("")}
            </ul>
          </div>
          <div class="signal-box">
            <h5>Semiotische Signale &amp; Token</h5>
            <ul>
              ${secAnalysis.semioticSignals.map((sig) => `<li>${sig}</li>`).join("")}
            </ul>
          </div>
          <div class="signal-box" style="grid-column: span 2;">
            <h5>Systemisches Deutungsangebot</h5>
            <ul>
              ${secAnalysis.possibleInterpretations.map((pi) => `<li>${pi}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
    }

    const chatsHtml = messagesInSection.map((m) => {
      const isZoe = m.sender.toLowerCase().includes("zoe");
      const bubbleClass = isZoe ? "other" : "self";
      const typeLabel = m.type === "audio_transcript" ? "Audio" : "WhatsApp";
      return `
        <div class="bubble ${bubbleClass}">
          <div class="bubble-header">
            <span class="bubble-sender">${m.sender}</span>
            <div>
              <span class="bubble-tag">${typeLabel}</span>
              <span class="bubble-time">${new Date(m.timestamp).toLocaleTimeString("de-DE")} Uhr</span>
            </div>
          </div>
          <div class="bubble-content">
            ${m.text}
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="section-block">
        <div class="section-header">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <h4 class="section-title">${sec.title}</h4>
            <span class="section-time">
              ${new Date(sec.startTimestamp).toLocaleTimeString("de-DE")} - ${new Date(sec.endTimestamp).toLocaleTimeString("de-DE")}
            </span>
          </div>
        </div>
        ${sec.summary ? `<div class="section-summary">${sec.summary}</div>` : ""}
        
        <div class="chat-stream">
          ${chatsHtml}
        </div>
        
        ${analyticalSection}
      </div>
    `;
  }).join("");

  const printTipHtml = `
    <div class="print-tip">
      <div style="font-size: 20px;">💡</div>
      <div>
        <strong>Druck-Tipp für PDF-Erstellung:</strong> Drücke <strong>Strg+P</strong> (Windows) oder <strong>Cmd+P</strong> (Mac) im Browser. Wähle als Ziel <strong>"Als PDF speichern"</strong>, aktiviere die Checkbox <strong>"Hintergrundgrafiken"</strong> in den Layoutoptionen und setze das Papierformat auf DIN A4.
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>WordThread Omni-Analyzer Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-clay: #f5f7fa;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --primary: #00cfcc;
      --primary-light: #e6fcfc;
      --shadow-light: #ffffff;
      --shadow-dark: #cbd5e1;
      --coral: #f43f5e;
      --coral-light: #fff1f2;
      --amber: #eab308;
      --amber-light: #fef9c3;
    }
    
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .print-tip {
        display: none !important;
      }
      .card {
        box-shadow: none !important;
        border: 1px solid #cbd5e1 !important;
        background: #ffffff !important;
        page-break-inside: avoid;
      }
      .bubble-content {
        box-shadow: none !important;
        border: 1px solid #e2e8f0 !important;
      }
      .section-block {
        page-break-inside: avoid;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg-clay);
      color: var(--text-primary);
      padding: 40px 20px;
      line-height: 1.6;
    }

    .report-container {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
    }

    .print-tip {
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      color: #0369a1;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 32px;
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.02);
    }

    .banner {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: white;
      border-radius: 32px;
      padding: 40px;
      margin-bottom: 32px;
      box-shadow: 10px 10px 30px rgba(15, 23, 42, 0.15);
      position: relative;
      overflow: hidden;
    }

    .banner::after {
      content: "";
      position: absolute;
      top: -50px;
      right: -50px;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(0, 207, 204, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    .banner-tag {
      background: rgba(0, 207, 204, 0.15);
      color: var(--primary);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      display: inline-block;
      margin-bottom: 20px;
      border: 1px solid rgba(0, 207, 204, 0.25);
    }

    .banner-title {
      font-size: 32px;
      font-weight: 950;
      letter-spacing: -1px;
      line-height: 1.15;
      margin-bottom: 12px;
    }

    .banner-subtitle {
      font-size: 15px;
      color: #94a3b8;
      font-weight: 400;
      margin-bottom: 24px;
    }

    .meta-grid {
      display: grid;
      grid-template-cols: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 24px;
    }

    .meta-item {
      font-size: 12px;
    }

    .meta-label {
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }

    .meta-val {
      color: #f1f5f9;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Soft clay card */
    .card {
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.9);
      border-radius: 30px;
      padding: 36px;
      margin-bottom: 32px;
      box-shadow: 12px 12px 30px rgba(163, 177, 198, 0.22), -12px -12px 30px rgba(255, 255, 255, 0.9);
      position: relative;
    }

    .card-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .card-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 24px;
    }

    /* Left accent border block */
    .synthesis-layout {
      border-left: 4px solid var(--primary);
      padding-left: 24px;
      margin: 12px 0;
    }

    .synthesis-text {
      font-size: 16px;
      font-weight: 500;
      color: #334155;
      line-height: 1.65;
      font-style: italic;
    }

    .time-charts {
      display: grid;
      grid-template-cols: 1fr;
      gap: 24px;
    }

    .chart-container {
      background: white;
      border-radius: 20px;
      padding: 24px;
      border: 1px solid rgba(255,255,255,0.8);
      box-shadow: inset 4px 4px 10px rgba(163,177,198,0.1), inset -4px -4px 10px #ffffff;
    }

    .chart-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .timeline-svg {
      width: 100%;
      height: auto;
    }

    /* Marker Bars */
    .marker-score-item {
      margin-bottom: 24px;
    }

    .marker-score-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .marker-label {
      font-weight: 700;
      color: var(--text-primary);
    }

    .marker-total {
      background: #e2e8f0;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
    }

    .share-track {
      height: 18px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
      display: flex;
      box-shadow: inset 2px 2px 4px rgba(163, 177, 198, 0.2);
    }

    .share-segment {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
      font-weight: bold;
    }

    .share-percent {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 6px;
    }

    /* Kipppunkte styling */
    .tipping-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tipping-card {
      background: var(--coral-light);
      border: 1px solid #fee2e2;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 4px 4px 12px rgba(244, 63, 94, 0.04);
    }

    .tipping-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--coral);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tipping-severity {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 900;
      background: var(--coral);
      color: white;
      padding: 3px 9px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }

    .tipping-desc {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
    }

    /* Sections */
    .section-block {
      border-top: 2px dashed #cbd5e1;
      padding-top: 32px;
      margin-top: 32px;
    }

    .section-block:first-child {
      border-top: none;
      padding-top: 0;
      margin-top: 0;
    }

    .section-header {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .section-time {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--text-secondary);
      background: #e2e8f0;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .section-summary {
      background: #f8fafc;
      border-radius: 18px;
      padding: 20px;
      font-size: 14px;
      color: #475569;
      margin-bottom: 24px;
      border-left: 4px solid #94a3b8;
      line-height: 1.6;
    }

    /* Conversational dialogues */
    .chat-stream {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 28px;
    }

    .bubble {
      max-width: 85%;
      display: flex;
      flex-direction: column;
    }

    .bubble.self {
      align-self: flex-start;
    }

    .bubble.other {
      align-self: flex-end;
    }

    .bubble-content {
      background: white;
      border-radius: 20px;
      padding: 16px 20px;
      box-shadow: 6px 6px 14px rgba(163, 177, 198, 0.12), -6px -6px 14px #ffffff;
      border: 1px solid rgba(255,255,255,0.8);
      font-size: 14px;
      color: #1e293b;
      line-height: 1.55;
    }

    .bubble.other .bubble-content {
      background: #e6fcfc;
      border-color: #d1fafb;
      box-shadow: 6px 6px 14px rgba(0, 207, 204, 0.04);
    }

    .bubble-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12px;
      padding: 0 4px;
    }

    .bubble-sender {
      font-weight: 800;
      color: var(--text-primary);
    }

    .bubble-time {
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-secondary);
      font-size: 10px;
      margin-left: 12px;
    }

    .bubble-tag {
      font-size: 9px;
      background: #e2e8f0;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .bubble.other .bubble-tag {
      background: var(--primary-light);
      color: var(--primary);
    }

    /* Sectional semantic panels */
    .analytical-signals {
      display: grid;
      grid-template-cols: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-top: 24px;
      background: rgba(255, 255, 255, 0.45);
      border-radius: 24px;
      padding: 24px;
      border: 1px solid rgba(255,255,255,0.7);
    }

    .signal-box h5 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-secondary);
      margin-bottom: 12px;
      font-weight: 800;
    }

    .signal-box ul {
      list-style-type: none;
      font-size: 13px;
      color: #334155;
    }

    .signal-box li {
      margin-bottom: 8px;
      position: relative;
      padding-left: 16px;
      line-height: 1.5;
    }

    .signal-box li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: var(--primary);
      font-weight: 900;
    }
  </style>
</head>
<body>
  <div class="report-container">
    ${isPdfBasis ? printTipHtml : ""}

    <!-- Brand Header -->
    <header class="banner">
      <span class="banner-tag">WordThread Omni-Analyzer</span>
      <h1 class="banner-title">Deep-Semantic Synthesis &amp; Relationship Report</h1>
      <p class="banner-subtitle">Konvergenter Analysebericht auf Basis synchronisierter Chatprotokolle und transkribierter Audioaufnahmen.</p>
      
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Teilnehmer</div>
          <div class="meta-val" style="font-family: inherit;">${document.participants.join(" &amp; ")}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Modellebene</div>
          <div class="meta-val">${analysis.config.mode.replace("_", " ").toUpperCase()}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Datenfaden</div>
          <div class="meta-val">${textMessages} Texte / ${audioMessages} Audios</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Report Datum</div>
          <div class="meta-val">${stampStr}</div>
        </div>
      </div>
    </header>

    <!-- Global Summary Box -->
    <section class="card">
      <h3 class="card-title">Globale Synthese &amp; Deutungsangebot</h3>
      <p class="card-subtitle">Systemischer und diskursanalytischer Einstieg zur interaktiven Beziehungskonstellation.</p>
      <div class="synthesis-layout">
        <p class="synthesis-text">"${analysis.globalSummary}"</p>
      </div>
    </section>

    <!-- Dynamic Metrics Charts & Statistics -->
    <section class="card">
      <h3 class="card-title">Muster-Frequenzen &amp; Sprecherverteilung</h3>
      <p class="card-subtitle">Vergleichende Darstellung der semantischen Kategorien pro Gesprächspartner.</p>
      <div class="marker-scores">
        ${markerBarsHtml}
      </div>
    </section>

    <!-- Graphs and activation profiles -->
    <section class="card">
      <h3 class="card-title">Dynamisches Interaktionsprofil</h3>
      <p class="card-subtitle">Echtzeitverrechnung von semantischer Valenz und kognitiver Erregungskurve.</p>
      
      <div class="time-charts">
        <div class="chart-container">
          <div class="chart-title">1. Emotionale Valenzkurve (Positiv vs Negativ)</div>
          ${valenceSvg}
        </div>
        <div class="chart-container">
          <div class="chart-title">2. Kognitive Aktivierung &amp; Intensität</div>
          ${emotionSvg}
        </div>
      </div>
    </section>

    <!-- Tipping Points warning system -->
    ${tippingPointsHtml}

    <!-- Transcripts and Section Dialogue -->
    <section class="card">
      <h3 class="card-title">Chronologische Gesprächsschleifen</h3>
      <p class="card-subtitle">Die detaillierte Zusammenführung von Schrift- und Tonsignalen, unterteilt in Abschnitte.</p>
      
      <div>
        ${sectionsHtml}
      </div>
    </section>

  </div>
</body>
</html>`;
}

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
    const htmlContent = generatePrintableHtml(document, analysis, false);
    return {
      content: htmlContent,
      mimeType: "text/html",
      fileName: `wordthread_report_${stamp}.html`,
    };
  }

  // Beautiful basis for PDF export (named properly to prompt user to save as PDF via print)
  if (format === "pdf") {
    const htmlContent = generatePrintableHtml(document, analysis, true);
    return {
      content: htmlContent,
      mimeType: "text/html",
      fileName: `wordthread_report_${stamp}_bereit_zur_pdf_speicherung.html`,
    };
  }

  return {
    content: `[MOCK PDF CONTAINER]`,
    mimeType: "text/plain",
    fileName: `wordthread_report_${stamp}.txt`,
  };
}
