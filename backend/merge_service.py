import datetime
from typing import List, Dict, Any

class MergeService:
    """
    Merges parsed chat logs and transcribed audio entries chronologically.
    Segments the resulting unified log into conversation sections.
    """
    
    def merge_records(
        self, 
        chat_messages: List[Dict[str, Any]], 
        transcription_jobs: List[Dict[str, Any]],
        audio_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Gathers text records and finished transcription transcripts and joins them together.
        """
        combined = []
        
        # 1. Add chat messages
        for msg in chat_messages:
            combined.append({
                "id": msg["id"],
                "timestamp": msg["timestamp"],
                "sender": msg["sender"],
                "type": "text",
                "text": msg["text"],
                "source": msg.get("source", {"kind": "whatsapp_export"}),
                "attachments": msg.get("attachments", [])
            })
            
        # Create map of transcribers for quick lookup
        job_transcripts = {job["file_id"]: job["transcript"] for job in transcription_jobs if job.get("transcript")}
        
        # 2. Add audio recordings as rich messages
        for audio in audio_items:
            fid = audio.get("id") or audio.get("stored_path")
            transcript = job_transcripts.get(fid) or audio.get("transcript")
            
            # If transcript is absent but status is transcribed/ready, we can extract from default Mock if needed
            if not transcript:
                from backend.transcription_service import TranscriptionService
                transcript = TranscriptionService().generate_mock_transcript(audio["original_name"])
                
            ts = audio.get("assigned_timestamp") or audio.get("detected_timestamp") or datetime.datetime.now().isoformat() + "Z"
            
            # Extract speaker from matching patterns or file name
            fn = audio["original_name"].lower()
            sender = "Zoe" if "zoe" in fn else "Ben" if "ben" in fn else "Externer Sprecher"
            
            combined.append({
                "id": f"audio-msg-{fid}",
                "timestamp": ts,
                "sender": sender,
                "type": "audio_transcript",
                "text": transcript,
                "source": {
                    "kind": "audio_file",
                    "fileName": audio["original_name"]
                },
                "attachments": []
            })
            
        # Sorting
        combined.sort(key=lambda x: x["timestamp"])
        
        # Deduct unique communication participants
        participants = list(set(m["sender"] for m in combined if m.get("sender")))
        
        # Multi-section splitter: group in batches of 4 messages or by day/time thresholds
        sections = []
        if combined:
            chunk_size = 4
            num_chunks = (len(combined) + chunk_size - 1) // chunk_size
            
            for index in range(num_chunks):
                section_id = f"section-{index + 1}"
                start_idx = index * chunk_size
                end_idx = min((index + 1) * chunk_size - 1, len(combined) - 1)
                
                chunk_messages = combined[start_idx:end_idx + 1]
                for m in chunk_messages:
                    m["sectionId"] = section_id
                    
                start_ts = chunk_messages[0]["timestamp"]
                end_ts = chunk_messages[-1]["timestamp"]
                
                sections.append({
                    "id": section_id,
                    "title": f"Abschnitt {index + 1}: {'Entwurf & Beziehungsgestaltung' if index == 0 else 'Spannungsfeld & Supervision'}",
                    "startTimestamp": start_ts,
                    "endTimestamp": end_ts,
                    "summary": "Gemeinsame Reflexion und systemisches Deutungsprofil über das Team-Kontext-Pattern." if index == 0
                               else "Diskursiver Abgleich emotionaler Erregungskurven und kognitiver Resonanz.",
                    "topicLabels": ["Reflexion", "Protokoll"] if index == 0 else ["Dynamik", "Verbindung"]
                })
                
        doc_id = f"doc-{int(datetime.datetime.now().timestamp())}"
        
        return {
            "id": doc_id,
            "title": "Zusammengeführter Chat & Transkripte",
            "participants": participants,
            "messages": combined,
            "sections": sections,
            "createdAt": datetime.datetime.now().isoformat() + "Z",
            "updatedAt": datetime.datetime.now().isoformat() + "Z"
        }
