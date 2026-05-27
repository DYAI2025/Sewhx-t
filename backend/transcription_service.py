import time
import random
from typing import Dict, Any, List

class TranscriptionService:
    """
    Simulates an asynchronous transcription queue for audio files (OPUS, WAV, MP3, etc.).
    Tracks status per file: queued -> transcribing -> transcribed -> error.
    """
    
    def __init__(self):
        # In-memory database of active jobs
        self.jobs: Dict[str, Dict[str, Any]] = {}

    def start_transcription(self, file_id: str, filename: str) -> Dict[str, Any]:
        """
        Registers a new transcription job and sets it to 'transcribing'.
        """
        # Determine duration based on name
        duration_sec = 15.0 if "zoe" in filename.lower() else 30.0
        
        self.jobs[file_id] = {
            "file_id": file_id,
            "filename": filename,
            "status": "transcribing",
            "progress": 0,
            "start_time": time.time(),
            "duration_sec": duration_sec,
            "error": None,
            "transcript": None
        }
        return self.jobs[file_id]

    def get_status(self, file_id: str) -> Dict[str, Any]:
        """
        Updates progress based on time elapsed and returns status structure.
        Uses deterministic mock text when completed.
        """
        if file_id not in self.jobs:
            return {
                "file_id": file_id,
                "status": "error",
                "error": "Transkriptionsauftrag nicht gefunden."
            }
            
        job = self.jobs[file_id]
        if job["status"] == "transcribed":
            return job
            
        elapsed = time.time() - job["start_time"]
        # Simulation: increments 20% per second
        progress = min(100, int(elapsed * 45))
        job["progress"] = progress
        
        if progress >= 100:
            job["status"] = "transcribed"
            job["transcript"] = self.generate_mock_transcript(job["filename"])
            
        return job

    def generate_mock_transcript(self, filename: str) -> str:
        fn_lower = filename.lower()
        if "zoe" in fn_lower:
            return (
                "Ben, ich habe mir intensiv Gedanken über unsere Teamkonstellation gemacht. "
                "Manchmal fühle ich mich ein wenig blockiert durch den Kommunikationsstil im Management. "
                "Ich glaube, wir sollten mehr über Empathie und transparente Führung reden."
            )
        elif "ben" in fn_lower:
            return (
                "Ja, das stimmt absolut. Ich höre hier eine emotionale Unterströmung raus, "
                "die wir unbedingt in der nächsten Supervision thematisieren sollten. Letztendlich "
                "arbeiten wir ja am gleichen Ziel und sollten an unserer Kooperation festhalten."
            )
        else:
            return (
                "Wir müssen unbedingt zusehen, dass wir die Absprachen kooperativ halten. "
                "Sonst blockieren wir uns gegenseitig und es entstehen unnötige Widerstände. "
                "Hier ist eine klare Grenze nötig."
            )
            
    def get_all_jobs(self) -> List[Dict[str, Any]]:
        return list(self.jobs.values())
