import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import services
from backend.whatsapp_import_service import WhatsAppImportService
from backend.media_classifier import MediaClassifier
from backend.chat_parser import ChatParser
from backend.attachment_matcher import AttachmentMatcher
from backend.transcription_service import TranscriptionService
from backend.merge_service import MergeService
from backend.semiotic_marker_service import SemioticMarkerService
from backend.llm_analysis_service import LLMAnalysisService
from backend.export_service import ExportService

app = FastAPI(
    title="WordThread Omni-Analyzer API",
    description="Full-stack backend services for structured WhatsApp merges, temporal alignments, and semiotic marker scanning.",
    version="1.0.0"
)

# Enable permissive CORS for local dev testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiates Services
import_service = WhatsAppImportService()
classifier = MediaClassifier()
parser = ChatParser()
matcher = AttachmentMatcher()
transcriber = TranscriptionService()
merge_service = MergeService()
semiotic_service = SemioticMarkerService()
llm_service = LLMAnalysisService()
export_service = ExportService()

# In-Memory Datastores (resembles database layers securely)
SESSIONS_DB: Dict[str, Dict[str, Any]] = {}
DOCUMENTS_DB: Dict[str, Dict[str, Any]] = {}
ANALYSES_DB: Dict[str, Dict[str, Any]] = {}

# Pydantic Schemas for route verification
class SessionCreate(BaseModel):
    client_label: Optional[str] = "WhatsApp Analysis Session"

class AnalysisConfigSchema(BaseModel):
    mode: str
    topicFocus: str
    markerCategories: Optional[List[Dict[str, Any]]] = None
    depth: Optional[str] = "balanced"
    includeEvidenceQuotes: Optional[bool] = True
    compareSpeakers: Optional[bool] = True
    detectTippingPoints: Optional[bool] = True
    generateHeatmap: Optional[bool] = True

@app.post("/api/import-sessions", status_code=status.HTTP_201_CREATED)
def create_session(session_input: Optional[SessionCreate] = None):
    label = session_input.client_label if session_input else "WhatsApp Analysis Session"
    session_id = import_service.generate_session_id()
    
    SESSIONS_DB[session_id] = {
        "id": session_id,
        "label": label,
        "files_uploaded": [],
        "chat_messages": [],
        "matched_attachments": [],
        "classification_manifest": [],
        "merged_document_id": None
    }
    
    return SESSIONS_DB[session_id]

@app.post("/api/import-sessions/{sessionId}/upload")
async def upload_files(sessionId: str, files: List[UploadFile] = File(...)):
    if sessionId not in SESSIONS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Importsitzung nicht gefunden."
        )
        
    session = SESSIONS_DB[sessionId]
    
    files_list_tuples = []
    for f in files:
        # Secure safety boundary: check upload size limit (e.g. max 50MB per file)
        content_bytes = await f.read()
        if len(content_bytes) > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Die Datei {f.filename} überschreitet das Upload-Limit von 50MB."
            )
        files_list_tuples.append((f.filename, content_bytes))
        
    import_results = import_service.import_raw_files(sessionId, files_list_tuples)
    # Save filenames securely in the session state
    for item in import_results["manifest"]:
        session["files_uploaded"].append(item)
        
    return {
        "sessionId": sessionId,
        "manifest": session["files_uploaded"]
    }

@app.post("/api/import-sessions/{sessionId}/classify")
def classify_files(sessionId: str):
    if sessionId not in SESSIONS_DB:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = SESSIONS_DB[sessionId]
    # Classify files
    manifest = classifier.classify_manifest(session["files_uploaded"])
    session["classification_manifest"] = manifest
    
    return {
        "sessionId": sessionId,
        "classified_manifest": manifest
    }

@app.post("/api/import-sessions/{sessionId}/parse-chat")
def parse_chat(sessionId: str):
    if sessionId not in SESSIONS_DB:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = SESSIONS_DB[sessionId]
    manifest = session.get("classification_manifest", [])
    
    # Locate chat_text file in the manifest log
    chat_file_entry = next((f for f in manifest if f["category"] == "chat_text"), None)
    if not chat_file_entry:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Kein WhatsApp Chat-Protokoll (.txt) in der Sitzung gefunden."
        )
        
    session_dir = import_service.get_session_dir(sessionId)
    file_path_abs = os.path.join(session_dir, chat_file_entry["stored_path"])
    
    try:
        with open(file_path_abs, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler beim Lesen des Chat-Protokolls: {str(e)}"
        )
        
    # Run WhatsApp Parser
    parsed_messages = parser.parse(content, chat_file_entry["original_name"])
    session["chat_messages"] = parsed_messages
    
    return {
        "sessionId": sessionId,
        "messages_count": len(parsed_messages),
        "messages": parsed_messages
    }

@app.post("/api/import-sessions/{sessionId}/match-attachments")
def match_attachments(sessionId: str):
    if sessionId not in SESSIONS_DB:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = SESSIONS_DB[sessionId]
    messages = session.get("chat_messages", [])
    manifest = session.get("classification_manifest", [])
    
    if not messages:
        raise HTTPException(status_code=400, detail="Parse the chat logs first before matching attachments.")
        
    matches = matcher.match_session_attachments(messages, manifest)
    session["matched_attachments"] = matches
    
    return {
        "sessionId": sessionId,
        "matched_count": len(matches),
        "messages_with_attachments": [m for m in messages if m.get("attachments")]
    }

@app.post("/api/import-sessions/{sessionId}/transcribe")
def start_transcriptions(sessionId: str):
    if sessionId not in SESSIONS_DB:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = SESSIONS_DB[sessionId]
    manifest = session.get("classification_manifest", [])
    
    # Locate any audio files inside the manifest list
    audio_files = [f for f in manifest if f["category"].startswith("audio")]
    triggered_jobs = []
    
    for f in audio_files:
        fid = f["original_name"] # Using filename as id
        job = transcriber.start_transcription(fid, f["original_name"])
        triggered_jobs.append(job)
        
    return {
        "sessionId": sessionId,
        "audio_files_count": len(audio_files),
        "jobs": triggered_jobs
    }

@app.get("/api/import-sessions/{sessionId}/transcription-status")
def check_transcription_status(sessionId: str):
    if sessionId not in SESSIONS_DB:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = SESSIONS_DB[sessionId]
    manifest = session.get("classification_manifest", [])
    audio_files = [f for f in manifest if f["category"].startswith("audio")]
    
    statuses = []
    for f in audio_files:
        fid = f["original_name"]
        status_info = transcriber.get_status(fid)
        statuses.append(status_info)
        
    complete = all(s["status"] in ["transcribed", "error"] for s in statuses)
    
    return {
        "sessionId": sessionId,
        "all_completed": complete,
        "statuses": statuses
    }

@app.post("/api/import-sessions/{sessionId}/merge")
def merge_and_finalize(sessionId: str):
    if sessionId not in SESSIONS_DB:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = SESSIONS_DB[sessionId]
    messages = session.get("chat_messages", [])
    manifest = session.get("classification_manifest", [])
    audio_files = [f for f in manifest if f["category"].startswith("audio")]
    
    # Extract transcripts for finished tasks
    trans_jobs = transcriber.get_all_jobs()
    
    # Run absolute merge service
    merged_doc = merge_service.merge_records(messages, trans_jobs, audio_files)
    
    # Store globally inside database
    doc_id = merged_doc["id"]
    DOCUMENTS_DB[doc_id] = merged_doc
    session["merged_document_id"] = doc_id
    
    return merged_doc

@app.post("/api/documents/{documentId}/export-merged")
def export_raw_document(documentId: str, format: str = "json"):
    if documentId not in DOCUMENTS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zusammengeführtes Dokument nicht gefunden."
        )
    doc = DOCUMENTS_DB[documentId]
    exp = export_service.export_merged_only(doc, format)
    return exp

@app.post("/api/documents/{documentId}/analysis/semiotic-marker-sense")
def analyze_semiotic_markers(documentId: str, config: AnalysisConfigSchema):
    if documentId not in DOCUMENTS_DB:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc = DOCUMENTS_DB[documentId]
    
    # Analyze keywords, spot categories and speakers
    marker_results = semiotic_service.analyze_markers(doc, config.markerCategories)
    
    # Spot conversational tipping points
    tippings = semiotic_service.detect_tipping_points(doc)
    
    # Run systemic interpretive evaluation
    llm_insights = llm_service.run_analysis(doc, marker_results, tippings)
    
    # Generate curves for valence and activeness
    curves = semiotic_service.generate_curves(doc["messages"])
    
    analysis_id = f"analysis-{int(datetime_from_iso().timestamp())}"
    
    analysis_result = {
        "id": analysis_id,
        "documentId": documentId,
        "config": config.dict(),
        "sectionResults": llm_insights["sectionResults"],
        "globalSummary": llm_insights["globalSummary"],
        "markerCounts": marker_results,
        "valenceSeries": curves["valenceSeries"],
        "emotionSeries": curves["emotionSeries"],
        "tippingPoints": tippings,
        "heatmap": [] # Optional matrix intensity details
    }
    
    ANALYSES_DB[analysis_id] = analysis_result
    return analysis_result

@app.get("/api/analyses/{analysisId}")
def get_analysis_by_id(analysisId: str):
    if analysisId not in ANALYSES_DB:
        raise HTTPException(status_code=404, detail="Analysis report not found.")
    return ANALYSES_DB[analysisId]

@app.post("/api/analyses/{analysisId}/export")
def export_analysis_report(analysisId: str, format: str = "json"):
    if analysisId not in ANALYSES_DB:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    analysis = ANALYSES_DB[analysisId]
    doc_id = analysis["documentId"]
    
    if doc_id not in DOCUMENTS_DB:
        raise HTTPException(status_code=404, detail="Related original document not found")
        
    doc = DOCUMENTS_DB[doc_id]
    exp = export_service.export_analysis(doc, analysis, format)
    return exp

def datetime_from_iso() -> Any:
    import datetime
    return datetime.datetime.now()
