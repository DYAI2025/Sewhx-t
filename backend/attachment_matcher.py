import os
import re
import datetime
from typing import List, Dict, Any

class AttachmentMatcher:
    """
    Pairs chat messages referencing attachments with actual files in the session upload.
    Outputs the matched file identifiers, lists strategies, and assigns confidence markers.
    """
    
    def normalize_name(self, filename: str) -> str:
        # Simplify filename by lowering, stripping extension and replacing non-alphanumeric
        base = os.path.splitext(filename)[0].lower()
        return re.sub(r'[^a-z0-9]', '', base)

    def parse_time(self, timestamp_iso: str) -> datetime.datetime:
        try:
            # Strip trailing 'Z' and parse
            cleaned = timestamp_iso.rstrip('Z')
            return datetime.datetime.fromisoformat(cleaned)
        except Exception:
            return datetime.datetime.min

    def match_session_attachments(
        self, 
        messages: List[Dict[str, Any]], 
        files: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Processes parsed messages and files, creating a mapping.
        Updates referenced_media on messages with real matched files or logs them in review.
        """
        matched_results = []
        
        # Index files by original name and normalized name
        files_by_exact = {f["original_name"].lower(): f for f in files}
        files_by_normalized = {self.normalize_name(f["original_name"]): f for f in files}
        
        for msg in messages:
            # Check if this chat message has references to media files
            refs = msg.get("referenced_media", [])
            msg_time = self.parse_time(msg["timestamp"])
            
            msg["attachments"] = []
            
            for ref in refs:
                matched_file = None
                strategy = None
                confidence = 100
                review_reason = None
                
                ref_lower = ref.lower()
                ref_norm = self.normalize_name(ref)
                
                # 1. Exact Match
                if ref_lower in files_by_exact:
                    matched_file = files_by_exact[ref_lower]
                    strategy = "exact_filename"
                    confidence = 100
                
                # 2. Normalized Match
                elif ref_norm in files_by_normalized:
                    matched_file = files_by_normalized[ref_norm]
                    strategy = "normalized_filename"
                    confidence = 90
                
                # 3. Temporal Match (If chat says e.g. 'Sprachnachricht weggelassen' (Audio omitted) and there is a voice note within 2 minutes)
                elif "audio" in ref_lower or "ptt" in ref_lower or "voice" in ref_lower or len(ref) < 15:
                    best_candidate = None
                    smallest_delta = datetime.timedelta(minutes=10) # 10 minute threshold
                    
                    for f in files:
                        # Only target structural audio formats
                        if not f.get("category", "").startswith("audio"):
                            continue
                            
                        # Try to detect timestamp from the audio filename if possible
                        from backend.media_classifier import MediaClassifier
                        # Use a fallback approach to extract a time from file
                        file_time = self.extract_time_from_filename(f["original_name"])
                        if file_time != datetime.datetime.min:
                            delta = abs(file_time - msg_time)
                            if delta < smallest_delta:
                                smallest_delta = delta
                                best_candidate = f
                                
                    if best_candidate:
                        matched_file = best_candidate
                        strategy = "temporal_proximity"
                        # Set confidence based on time distance
                        mins = smallest_delta.total_seconds() / 60.0
                        confidence = max(40, int(90 - (mins * 5)))
                        if confidence < 75:
                            review_reason = f"Zeitliche Abweichung beträgt {mins:.1f} Minuten. Abstimmung prüfen."
                
                if matched_file:
                    attachment_obj = {
                        "referenced_as": ref,
                        "matched_file_name": matched_file["original_name"],
                        "stored_path": matched_file["stored_path"],
                        "category": matched_file.get("category", "unknown"),
                        "strategy": strategy,
                        "confidence": confidence,
                        "status": "ready" if confidence >= 75 else "needs_review",
                        "review_reason": review_reason
                    }
                    msg["attachments"].append(attachment_obj)
                    matched_results.append({
                        "message_id": msg["id"],
                        "attachment": attachment_obj
                    })
                    
        return matched_results

    def extract_time_from_filename(self, filename: str) -> datetime.datetime:
        # Regex 1: WhatsApp Date formatting: WhatsApp Audio 2025-06-29 at 13.20.58.opus
        wa_regex = re.compile(r'(\d{4})-(\d{2})-(\d{2})\s+at\s+(\d{2})\.(\d{2})\.(\d{2})', re.IGNORECASE)
        # Regex 2: PTT-20250629-WA0001.opus
        ptt_regex = re.compile(r'PTT-(\d{4})(\d{2})(\d{2})-WA', re.IGNORECASE)
        # Regex 3: YYYY-MM-DD-HH-MM-SS
        spaced_regex = re.compile(r'(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})')
        
        match = wa_regex.search(filename)
        if match:
            try:
                yr, mt, dy, hr, mn, sc = match.groups()
                return datetime.datetime(int(yr), int(mt), int(dy), int(hr), int(mn), int(sc))
            except Exception:
                pass
                
        match = spaced_regex.search(filename)
        if match:
            try:
                yr, mt, dy, hr, mn, sc = match.groups()
                return datetime.datetime(int(yr), int(mt), int(dy), int(hr), int(mn), int(sc))
            except Exception:
                pass
                
        match = ptt_regex.search(filename)
        if match:
            try:
                yr, mt, dy = match.groups()
                return datetime.datetime(int(yr), int(mt), int(dy), 12, 0, 0) # default noon
            except Exception:
                pass
                
        return datetime.datetime.min
