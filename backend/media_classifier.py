import os
from typing import List, Dict, Any

class MediaClassifier:
    """
    Classifies files into types specified by the user requirement:
    chat_text, audio_opus, audio_m4a, audio_mp3, audio_wav, image, video, document, unknown, ignored.
    """
    
    AUDIO_EXT_MAP = {
        "opus": "audio_opus",
        "m4a": "audio_m4a",
        "mp3": "audio_mp3",
        "wav": "audio_wav",
        "ogg": "audio_opus" # Normalize ogg as opus/voice codec
    }
    
    IMAGE_EXTS = {"jpg", "jpeg", "png", "gif", "webp"}
    VIDEO_EXTS = {"mp4", "mov", "avi", "3gp", "mkv"}
    DOC_EXTS = {"pdf", "docx", "xlsx", "pptx", "csv"}
    
    def classify_file(self, filename: str) -> str:
        name_lower = filename.lower()
        ext = name_lower.split(".")[-1] if "." in name_lower else ""
        
        if name_lower == "_chat.txt" or (name_lower.endswith(".txt") and "chat" in name_lower):
            return "chat_text"
        elif name_lower.endswith(".txt"):
            return "chat_text"  # Default assumption for WhatsApp style text exports
            
        if ext in self.AUDIO_EXT_MAP:
            return self.AUDIO_EXT_MAP[ext]
            
        if ext in self.IMAGE_EXTS:
            return "image"
            
        if ext in self.VIDEO_EXTS:
            return "video"
            
        if ext in self.DOC_EXTS:
            return "document"
            
        if ext in {"ds_store", "tmp", "ini"}:
            return "ignored"
            
        return "unknown"

    def classify_manifest(self, manifest: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        classified_list = []
        for file_entry in manifest:
            filename = file_entry["original_name"]
            category = self.classify_file(filename)
            
            # Additional detail for Voice Notes (Opus is standard for WA Ptts)
            is_voice_note = (category == "audio_opus") or ("ptt" in filename.lower())
            
            classified_list.append({
                **file_entry,
                "category": category,
                "is_voice_note": is_voice_note,
                "file_extension": filename.split(".")[-1].lower() if "." in filename else ""
            })
        return classified_list
