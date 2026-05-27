export type SupportedAudioFormat = "opus" | "m4a" | "mp3" | "wav";

export type FileStatus =
  | "queued"
  | "validating"
  | "ready"
  | "transcribing"
  | "transcribed"
  | "needs_review"
  | "error";

export type ChatMessage = {
  id: string;
  timestamp: string;
  sender: string;
  type: "text" | "audio_transcript" | "system";
  text: string;
  source?: {
    kind: "whatsapp_export" | "audio_file" | "manual_edit";
    fileName?: string;
    audioId?: string;
  };
  sectionId?: string;
};

export type AudioFileItem = {
  id: string;
  file?: File;
  fileName: string;
  format: SupportedAudioFormat;
  sizeBytes: number;
  detectedTimestamp?: string;
  assignedTimestamp?: string;
  transcript?: string;
  status: FileStatus;
  confidence?: number;
  error?: string;
};

export type ChatSection = {
  id: string;
  title: string;
  startTimestamp: string;
  endTimestamp: string;
  summary?: string;
  topicLabels?: string[];
};

export type MergedChatDocument = {
  id: string;
  title: string;
  participants: string[];
  messages: ChatMessage[];
  sections: ChatSection[];
  createdAt: string;
  updatedAt: string;
};

export type AnalysisMode =
  | "relationship_analysis"
  | "deep_analysis"
  | "semiotic_analysis"
  | "semantic_analysis"
  | "emotion_dynamics"
  | "marker_count"
  | "keyword_analysis";

export type MarkerCategory = {
  id: string;
  label: string;
  keywords: string[];
  colorToken: string;
};

export type AnalysisConfig = {
  mode: AnalysisMode;
  topicFocus: string;
  markerCategories: MarkerCategory[];
  depth: "fast" | "balanced" | "deep";
  includeEvidenceQuotes: boolean;
  compareSpeakers: boolean;
  detectTippingPoints: boolean;
  generateHeatmap: boolean;
};

export type SectionAnalysisResult = {
  sectionId: string;
  summary: string;
  semanticMeaning: string[];
  semioticSignals: string[];
  possibleInterpretations: string[];
  evidenceMessageIds: string[];
};

export type MarkerCount = {
  markerId: string;
  label: string;
  count: number;
  bySpeaker: Record<string, number>;
};

export type TimeSeriesPoint = {
  timestamp: string;
  value: number;
  speaker?: string;
  label?: string;
};

export type TippingPoint = {
  id: string;
  timestamp: string;
  sectionId: string;
  title: string;
  description: string;
  evidenceMessageIds: string[];
  severity: "low" | "medium" | "high";
};

export type HeatmapCell = {
  sectionId: string;
  speaker: string;
  markerId: string;
  intensity: number;
};

export type AnalysisResult = {
  id: string;
  documentId: string;
  config: AnalysisConfig;
  sectionResults: SectionAnalysisResult[];
  globalSummary: string;
  markerCounts: MarkerCount[];
  valenceSeries: TimeSeriesPoint[];
  emotionSeries: TimeSeriesPoint[];
  tippingPoints: TippingPoint[];
  heatmap: HeatmapCell[];
};
