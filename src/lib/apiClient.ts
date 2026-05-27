import { 
  ChatMessage, 
  AudioFileItem, 
  MergedChatDocument, 
  AnalysisConfig, 
  AnalysisResult 
} from "../types";
import { 
  parseWhatsAppExport, 
  getAudioFormat, 
  extractAudioTimestamp, 
  mergeChatAndAudio, 
  runAnalysis, 
  exportDocument 
} from "./mockServices";

const API_BASE_URL = ""; // Relative paths solve CORS proxy automatically or point to port 3000

class ApiClient {
  private isBackendOnline: boolean | null = null;

  async checkBackendHealth(): Promise<boolean> {
    if (this.isBackendOnline !== null) return this.isBackendOnline;
    try {
      const response = await fetch(`${API_BASE_URL}/api/import-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_label: "Health Check" })
      });
      if (response.ok) {
        this.isBackendOnline = true;
        return true;
      }
    } catch (e) {
      // Ignored - fallback to offline emulation
    }
    this.isBackendOnline = false;
    return false;
  }

  // 1. Create session
  async createImportSession(label: string): Promise<any> {
    const online = await this.checkBackendHealth();
    if (online) {
      const response = await fetch(`${API_BASE_URL}/api/import-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_label: label })
      });
      return response.json();
    }
    
    // Fallback simulation
    return {
      id: `session-local-${Date.now()}`,
      label,
      files_uploaded: [],
      chat_messages: [],
      matched_attachments: [],
      classification_manifest: [],
      merged_document_id: null
    };
  }

  // 2. Upload files
  async uploadRawFiles(sessionId: string, files: File[]): Promise<any> {
    const online = await this.checkBackendHealth();
    if (online && !sessionId.startsWith("session-local-")) {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      const response = await fetch(`${API_BASE_URL}/api/import-sessions/${sessionId}/upload`, {
        method: "POST",
        body: formData
      });
      return response.json();
    }

    // Mock manifest
    const manifest = files.map((f, i) => ({
      original_name: f.name,
      stored_path: f.name,
      file_size: f.size
    }));
    return { sessionId, manifest };
  }

  // 3. Classify files
  async classifyFiles(sessionId: string, localFiles: File[]): Promise<any> {
    const online = await this.checkBackendHealth();
    if (online && !sessionId.startsWith("session-local-")) {
      const response = await fetch(`${API_BASE_URL}/api/import-sessions/${sessionId}/classify`, {
        method: "POST"
      });
      return response.json();
    }

    // Fallback classification using filename extensions
    const classified_manifest = localFiles.map((f) => {
      const name = f.name;
      const lower = name.toLowerCase();
      let category = "unknown";
      
      if (lower.endsWith(".txt")) {
        category = "chat_text";
      } else if (lower.endsWith(".opus")) {
        category = "audio_opus";
      } else if (lower.endsWith(".m4a")) {
        category = "audio_m4a";
      } else if (lower.endsWith(".mp3")) {
        category = "audio_mp3";
      } else if (lower.endsWith(".wav")) {
        category = "audio_wav";
      } else if (["jpg", "jpeg", "png", "gif", "webp"].some((ext) => lower.endsWith(ext))) {
        category = "image";
      } else if (["mp4", "mov", "avi"].some((ext) => lower.endsWith(ext))) {
        category = "video";
      } else if (["pdf", "docx", "pptx"].some((ext) => lower.endsWith(ext))) {
        category = "document";
      }

      return {
        original_name: f.name,
        stored_path: f.name,
        file_size: f.size,
        category,
        is_voice_note: category === "audio_opus" || lower.includes("ptt"),
        file_extension: name.split(".").pop() || ""
      };
    });

    return { sessionId, classified_manifest };
  }

  // 4. Parse WhatsApp Text
  async parseChat(sessionId: string, chatFileContent: string, fileName: string): Promise<any> {
    const online = await this.checkBackendHealth();
    if (online && !sessionId.startsWith("session-local-")) {
      const response = await fetch(`${API_BASE_URL}/api/import-sessions/${sessionId}/parse-chat`, {
        method: "POST"
      });
      return response.json();
    }

    // Fallback parse helper
    const messages = parseWhatsAppExport(chatFileContent, fileName);
    return { sessionId, messages_count: messages.length, messages };
  }

  // 5. Match attachments
  async matchAttachments(sessionId: string, messages: ChatMessage[], classifiedManifest: any[]): Promise<any> {
    const online = await this.checkBackendHealth();
    if (online && !sessionId.startsWith("session-local-")) {
      const response = await fetch(`${API_BASE_URL}/api/import-sessions/${sessionId}/match-attachments`, {
        method: "POST"
      });
      return response.json();
    }

    // Client-side mapping strategy
    const messages_with_attachments = messages.map((msg) => {
      const refs = msg.text.match(/(?:<Anhang:\s*)?([a-zA-Z0-9_\-\.\s]+\.[a-zA-Z0-9]{3,4})>/i) || [];
      const attachments = [];
      if (refs && refs[1]) {
        const refName = refs[1];
        const matched = classifiedManifest.find(f => f.original_name.toLowerCase() === refName.toLowerCase());
        if (matched) {
          attachments.push({
            referenced_as: refName,
            matched_file_name: matched.original_name,
            stored_path: matched.stored_path,
            category: matched.category,
            strategy: "exact_filename",
            confidence: 100,
            status: "ready"
          });
        }
      }
      return { ...msg, attachments };
    });

    return { sessionId, messages_with_attachments };
  }

  // 6. Transcribe
  async triggerTranscription(sessionId: string): Promise<any> {
    const online = await this.checkBackendHealth();
    if (online && !sessionId.startsWith("session-local-")) {
      const response = await fetch(`${API_BASE_URL}/api/import-sessions/${sessionId}/transcribe`, {
        method: "POST"
      });
      return response.json();
    }

    // Local trigger placeholder
    return { sessionId, jobs_started: true };
  }

  // 7. Get Transcription progress/statuses
  async getTranscriptionStatus(sessionId: string, audioFiles: AudioFileItem[]): Promise<any> {
    const online = await this.checkBackendHealth();
    if (online && !sessionId.startsWith("session-local-")) {
      const response = await fetch(`${API_BASE_URL}/api/import-sessions/${sessionId}/transcription-status`);
      return response.json();
    }

    // Mock progress statuses
    const statuses = audioFiles.map((file) => ({
      file_id: file.id,
      filename: file.fileName,
      status: "transcribed",
      progress: 100,
      transcript: file.transcript || "Simuliertes Transkript für Sprachnachricht. Die Ausrichtung mit dem Chat-Faden wurde erfolgreich durchgeführt."
    }));

    return { sessionId, all_completed: true, statuses };
  }

  // 8. Merge
  async mergeSessionAndCreateDoc(sessionId: string, chatMessages: ChatMessage[], audioFiles: AudioFileItem[]): Promise<MergedChatDocument> {
    const online = await this.checkBackendHealth();
    if (online && !sessionId.startsWith("session-local-")) {
      const response = await fetch(`${API_BASE_URL}/api/import-sessions/${sessionId}/merge`, {
        method: "POST"
      });
      return response.json();
    }

    // Local service execution
    return mergeChatAndAudio(chatMessages, audioFiles);
  }

  // 9. Raw download (reconstruction of originals without requiring analysis)
  async downloadRawMergedDoc(documentId: string, mergedDoc: MergedChatDocument, format: "json" | "txt" | "markdown" | "html"): Promise<any> {
    const online = await this.checkBackendHealth();
    if (online && !documentId.startsWith("doc-local")) {
      const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/export-merged?format=${format}`, {
        method: "POST"
      });
      return response.json();
    }

    // Fallback generation using exportDocument
    // Assemble a fast mock-up analysis block just to proxy formatting
    const config: AnalysisConfig = {
      mode: "marker_count",
      topicFocus: "Allgemein",
      markerCategories: [],
      depth: "fast",
      includeEvidenceQuotes: false,
      compareSpeakers: false,
      detectTippingPoints: false,
      generateHeatmap: false
    };
    const mockAns: AnalysisResult = runAnalysis(mergedDoc, config);
    return exportDocument(mergedDoc, mockAns, format === "markdown" ? "markdown" : format === "txt" ? "txt" : format);
  }

  // 10. Run analysis using semiotic-marker-sense
  async runSemioticMarkerSense(documentId: string, doc: MergedChatDocument, config: AnalysisConfig): Promise<AnalysisResult> {
    const online = await this.checkBackendHealth();
    if (online && !documentId.startsWith("doc-local")) {
      const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/analysis/semiotic-marker-sense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      return response.json();
    }

    // Local calculations
    return runAnalysis(doc, config);
  }

  // 11. Export analysis report separately
  async exportAnalysisReport(analysisId: string, mergedDoc: MergedChatDocument, analysisRes: AnalysisResult, format: "json" | "pdf" | "markdown" | "txt" | "html"): Promise<any> {
    const online = await this.checkBackendHealth();
    if (online && !analysisId.startsWith("result-local-")) {
      const response = await fetch(`${API_BASE_URL}/api/analyses/${analysisId}/export?format=${format}`, {
        method: "POST"
      });
      return response.json();
    }

    // Fallback exporter
    return exportDocument(mergedDoc, analysisRes, format);
  }
}

export const apiClient = new ApiClient();
