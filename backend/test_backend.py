import os
import tempfile
import zipfile
import pytest

from backend.whatsapp_import_service import WhatsAppImportService
from backend.media_classifier import MediaClassifier
from backend.chat_parser import ChatParser
from backend.attachment_matcher import AttachmentMatcher
from backend.transcription_service import TranscriptionService
from backend.merge_service import MergeService
from backend.semiotic_marker_service import SemioticMarkerService
from backend.llm_analysis_service import LLMAnalysisService

def test_zip_import_slip_protection():
    """
    Validates that our secure extraction utility ignores or filters out files
    designed to traverse out of the extraction root folder (Zip-Slip defense).
    """
    service = WhatsAppImportService()
    
    with tempfile.TemporaryDirectory() as extraction_dir:
        # Create a malicious ZIP mock in-memory
        zip_path = os.path.join(extraction_dir, "test.zip")
        with zipfile.ZipFile(zip_path, 'w') as zip_file:
            # Write a normal file
            zip_file.writestr("safe_file.txt", "Normal file content")
            # Write a slip-traversal file
            zip_file.writestr("../path_slip_traversal_test.txt", "Zip-slip malicious content")
            
        unzipped_dest = os.path.join(extraction_dir, "extracted_dest")
        extracted_files = service.extract_zip_securely(zip_path, unzipped_dest)
        
        # Verify safe file extracted, and unsafe traversal file omitted
        assert "safe_file.txt" in extracted_files
        assert any("path_slip" in f for f in extracted_files) is False

def test_media_classification():
    classifier = MediaClassifier()
    assert classifier.classify_file("WhatsApp Chat with Zoe.txt") == "chat_text"
    assert classifier.classify_file("WhatsApp Audio 2025-06-29 at 13.20.58.opus") == "audio_opus"
    assert classifier.classify_file("presentation-slides.pptx") == "document"
    assert classifier.classify_file("screenshot.png") == "image"
    assert classifier.classify_file("random_log.log") == "unknown"

def test_chat_parser_parsing():
    parser = ChatParser()
    chat_raw = (
        "[29.06.25, 13:02:00] Zoe: Hey Ben!\n"
        "[29.06.25, 13:04:30] Ben: Hallo Zoe, lass uns das anpassen.\n"
        "Hier ist ein Zeilenumbruch im Text!\n"
        "[29.06.25, 13:08:15] Zoe: <PTT-20250629-WA0001.opus weggelassen>"
    )
    
    messages = parser.parse(chat_raw, "test_chat.txt")
    
    # Check 3 primary messages parsed
    assert len(messages) == 3
    # Check multiline formatting appended
    assert "Zeilenumbruch" in messages[1]["text"]
    # Check referenced media discovered
    assert "PTT-20250629-WA0001.opus" in messages[2]["referenced_media"]

def test_attachment_matcher():
    matcher = AttachmentMatcher()
    
    messages = [{
        "id": "m1",
        "timestamp": "2025-06-29T13:08:15Z",
        "sender": "Zoe",
        "referenced_media": ["PTT-20250629-WA0001.opus"]
    }]
    
    files = [{
        "original_name": "PTT-20250629-WA0001.opus",
        "stored_path": "extracted/PTT-20250629-WA0001.opus",
        "category": "audio_opus"
    }]
    
    matches = matcher.match_session_attachments(messages, files)
    assert len(matches) == 1
    assert matches[0]["attachment"]["strategy"] == "exact_filename"
    assert matches[0]["attachment"]["confidence"] == 100

def test_transcription_service_status():
    service = TranscriptionService()
    # Trigger a mock job
    job = service.start_transcription("audio_1", "PTT-20250629-WA0001.opus")
    assert job["status"] == "transcribing"
    
    # Simulate processing completion
    status_info = service.get_status("audio_1")
    # Immediate fetch returns state, wait time is simulated but status can be retrieved
    assert status_info["file_id"] == "audio_1"

def test_merge_and_sections():
    merge = MergeService()
    
    chat_msgs = [
        {"id": "c1", "timestamp": "2025-06-29T13:02:00Z", "sender": "Zoe", "text": "Hi!", "referenced_media": []},
        {"id": "c2", "timestamp": "2025-06-29T13:04:00Z", "sender": "Ben", "text": "Hallo!", "referenced_media": []}
    ]
    
    audio_items = [
        {
            "original_name": "Zoe-Audio.opus",
            "assigned_timestamp": "2025-06-29T13:03:00Z",
            "transcript": "Sprachaufzeichnungstext..."
        }
    ]
    
    # Merge items choronologically
    res = merge.merge_records(chat_msgs, [], audio_items)
    
    # Assert messages array contains 3 elements and starts with c1, then Zoe-Audio, then c2
    assert len(res["messages"]) == 3
    assert res["messages"][1]["id"] == "audio-msg-Zoe-Audio.opus"
    assert len(res["sections"]) > 0

def test_semiotic_marking():
    service = SemioticMarkerService()
    
    doc = {
        "participants": ["Zoe", "Ben"],
        "messages": [
            {"id": "u1", "sender": "Zoe", "text": "Ich finde wir arbeiten gemeinsam gut zusammen.", "timestamp": "2025-06-29T13:00:00Z"},
            {"id": "u2", "sender": "Ben", "text": "Ja, aber manchmal blockiert mich diese Grenze.", "timestamp": "2025-06-29T13:01:00Z"}
        ]
    }
    
    analysis = service.analyze_markers(doc)
    
    # Locate cooperation marker (labeled 'Kooperation')
    coop = next(x for x in analysis if x["label"] == "Kooperation")
    # 'gemeinsam', 'zusammen' -> 2 hits in Zoe's statement
    assert coop["count"] >= 2
    assert coop["bySpeaker"]["Zoe"] >= 2

def test_llm_cautious_interpretation():
    service = LLMAnalysisService()
    
    doc = {
        "participants": ["Zoe", "Ben"],
        "sections": [{"id": "section-1", "title": "Section 1", "startTimestamp": "2025-06-29T13:00:00Z", "endTimestamp": "2025-06-29T13:01:00Z"}],
        "messages": [{"id": "m1", "sectionId": "section-1", "sender": "Zoe", "text": "Test"}]
    }
    
    out = service.run_analysis(doc, [], [])
    
    # Check that offerings are using cautious system words
    assert "globalSummary" in out
    summary = out["globalSummary"].lower()
    # No clinical diagnostic claims, strictly relational hypotheses
    assert "empfohlen" in summary or "beziehung" in summary
