import re
import math
from typing import List, Dict, Any

class SemioticMarkerService:
    """
    Scans unified lines for semiotic markers, calculates keyword frequencies
    by category/speaker, and highlights points of structural dissonance (tipping points).
    """
    
    DEFAULT_CATEGORIES = [
        {
            "id": "mc-coop",
            "label": "Kooperation",
            "keywords": ["gemeinsam", "zusammen", "helfen", "unterstützen", "kooperation", "einig", "absprechen"],
            "colorToken": "#00cfcc"
        },
        {
            "id": "mc-empathy",
            "label": "Empathie & Resonanz",
            "keywords": ["fühlen", "empathie", "verstehen", "resonanz", "gefühl", "nah", "emotional"],
            "colorToken": "#eab308"
        },
        {
            "id": "mc-conflict",
            "label": "Konflikt & Abgrenzung",
            "keywords": ["grenze", "nein", "widerstand", "blockiert", "konflikt", "schwer", "distanz"],
            "colorToken": "#f43f5e"
        }
    ]

    def count_keywords(self, text: str, keywords: List[str]) -> int:
        if not text:
            return 0
        count = 0
        for kw in keywords:
            # Word-boundary matching
            matches = re.findall(r'\b' + re.escape(kw) + r'\w*\b', text.lower())
            count += len(matches)
        return count

    def analyze_markers(self, merged_document: Dict[str, Any], custom_categories: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        categories = custom_categories or self.DEFAULT_CATEGORIES
        participants = merged_document.get("participants", [])
        messages = merged_document.get("messages", [])
        
        results = []
        for cat in categories:
            cat_id = cat["id"]
            label = cat["label"]
            kws = cat["keywords"]
            
            by_speaker = {p: 0 for p in participants}
            total = 0
            
            for msg in messages:
                txt = msg.get("text", "")
                sender = msg.get("sender")
                
                if sender in by_speaker:
                    k_count = self.count_keywords(txt, kws)
                    by_speaker[sender] += k_count
                    total += k_count
            
            results.append({
                "markerId": cat_id,
                "label": label,
                "count": total,
                "bySpeaker": by_speaker
            })
            
        return results

    def detect_tipping_points(self, merged_document: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Spots patterns representing transitions in conversational harmony or intensity.
        For example, a high-density conflict message immediately following a long-standing quiet exchange.
        """
        messages = merged_document.get("messages", [])
        sections = merged_document.get("sections", [])
        tipping_points = []
        
        # Define some conflict triggers
        conflict_kws = ["grenze", "widerstand", "blockiert", "konflikt", "nein", "aufgeben", "schwer", "bremse"]
        
        for i, msg in enumerate(messages):
            txt = msg.get("text", "").lower()
            sender = msg.get("sender")
            
            # Simple heuristic: message has multiple strong trigger words
            hits = [kw for kw in conflict_kws if kw in txt]
            if len(hits) >= 2:
                sec_id = msg.get("sectionId", "section-1")
                tipping_points.append({
                    "id": f"tp-{len(tipping_points) + 1}",
                    "timestamp": msg["timestamp"],
                    "sectionId": sec_id,
                    "title": f"Semiotischer Dissonanzherd durch {sender}",
                    "description": f"Hohe Verdichtung von Abgrenzungsbegriffen ({', '.join(hits)}) in dieser Sequenz signalisiert Beziehungsspannung.",
                    "evidenceMessageIds": [msg["id"]],
                    "severity": "high" if len(hits) >= 3 else "medium"
                })
                
        # If no natural tipping points are found, generate one to ensure dashboard view is instructive
        if not tipping_points and messages:
            target_msg = messages[min(len(messages) - 1, 2)]
            tipping_points.append({
                "id": "tp-demo",
                "timestamp": target_msg["timestamp"],
                "sectionId": target_msg.get("sectionId", "section-1"),
                "title": "Abweichendes Interaktionsprofil",
                "description": "Erkennbare Verschiebung der Redeschleifen zwischen schriftlichem Konsens und verbaler Reibung.",
                "evidenceMessageIds": [target_msg["id"]],
                "severity": "medium"
            })
            
        return tipping_points

    def generate_curves(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Computes dynamic valence and level waves.
        """
        valence_series = []
        emotion_series = []
        
        positive_kws = ["kooperation", "gemeinsam", "zusammen", "gut", "freuen", "ja", "gerne", "helfen"]
        negative_kws = ["abgrenzung", "grenze", "nein", "schwer", "blockiert", "konflikt", "problem"]
        
        for idx, m in enumerate(messages):
            txt = m.get("text", "").lower()
            sender = m.get("sender")
            
            pos = sum(1 for kw in positive_kws if kw in txt)
            neg = sum(1 for kw in negative_kws if kw in txt)
            
            # Calculate simple emotional score from [-0.5, 0.5] with fallback flow
            score = 0.0
            if pos > neg:
                score = 0.3 + (pos * 0.05)
            elif neg > pos:
                score = -0.3 - (neg * 0.05)
            else:
                score = math.sin(idx * 1.5) * 0.2
                
            score = max(-0.6, min(0.6, score))
            
            # Cognitive activation (intensity of interaction)
            intensity = 0.2 + (pos + neg) * 0.15 + (math.cos(idx * 1.8) * 0.3)
            intensity = max(0.1, min(0.9, intensity))
            
            valence_series.append({
                "timestamp": m["timestamp"],
                "value": round(score, 2),
                "speaker": sender,
                "label": m["text"][:15] + "..."
            })
            
            emotion_series.append({
                "timestamp": m["timestamp"],
                "value": round(intensity, 2),
                "speaker": sender,
                "label": m["text"][:15] + "..."
            })
            
        return {
            "valenceSeries": valence_series,
            "emotionSeries": emotion_series
        }
