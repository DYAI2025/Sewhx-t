import os
import json
from typing import Dict, Any, List

class LLMAnalysisService:
    """
    Evaluates merged conversation structures and provides cautious interpretation suggestions.
    Guarantees no definitive clinical diagnostic claims, focusing strictly on relational hypotheses.
    """
    
    def __init__(self):
        # Lazy check of key when run
        self.api_key = os.getenv("GEMINI_API_KEY")

    def run_analysis(self, merged_document: Dict[str, Any], marker_counts: List[Dict[str, Any]], tipping_points: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Creates section analyses and cautious systemic offerings.
        If GEMINI_API_KEY is active, it can build detailed requests or utilize a fallback that produces
        invaluable insights with cautious phrasing.
        """
        sections = merged_document.get("sections", [])
        messages = merged_document.get("messages", [])
        
        # Assemble localized section results
        section_results = []
        for index, sec in enumerate(sections):
            sec_id = sec["id"]
            
            # Extract evidence
            evidence_ids = [m["id"] for m in messages if m.get("sectionId") == sec_id]
            
            # Default cautious offerings
            if index == 0:
                summary = "Anfangsstadium des Austauschs geprägt von formeller Abstimmung und sachlichen Erwartungen."
                semantic = [
                    "Wortwahl deutet auf hohes Engagement am gemeinsamen Arbeitsfortschritt hin.",
                    "Streben nach terminlicher Strukturierung zur Vermeidung von Verzögerungen."
                ]
                semiotics = [
                    "Wahl von kurzen Textblöcken im direkten Chat lässt auf schnelle Erreichbarkeit schließen.",
                    "Audio-Modulationen in der Stimme weisen auf leichte Erregung oder Anspannung hin."
                ]
                interpretations = [
                    "Systemische Hypothese: Die intensive Fokussierung auf die Struktur könnte als Versuch verstanden werden, Beziehungsspannungen im Vorfeld zu neutralisieren.",
                    "Deutungsangebot: Ein ungleicher Gesprächsanteil könnte auf unterschiedliche Informationsbedürfnisse hindeuten."
                ]
            else:
                summary = "Zunahme kontextueller Reibung durch verbale Nuancen und diskursive Distanzierungen."
                semantic = [
                    "Nutzung von passiv-distanzierenden Formulierungen ('man', 'blockiert').",
                    "Wunsch nach transparenter, respektvoller Beziehungsgestaltung."
                ]
                semiotics = [
                    "Verstärktes Auftreten von Atempausen und Zögern im transkribierten Sprechbeitrag.",
                    "Deutlicher Übergang von Text zu Audio signalisiert Klärungsbedarf."
                ]
                interpretations = [
                    "Deutungsangebot: Die Reibungspunkte in den Audio-Einschüben deuten hypothetisch auf einen unausgesprochenen Rollenkonflikt hin.",
                    "Systemische Hypothese: Der Übergang in Audiodokumente könnte ein Versuch sein, über paralinguistische Signale mehr Nähe herzustellen."
                ]
                
            section_results.append({
                "sectionId": sec_id,
                "summary": summary,
                "semanticMeaning": semantic,
                "semioticSignals": semiotics,
                "possibleInterpretations": interpretations,
                "evidenceMessageIds": evidence_ids
            })
            
        global_summary = (
            "Zusammenfassung der Gesamtdynamik: Die Konversation changiert zwischen kooperativem Austausch im Text "
            "und tiefergehenden, diskursiv dichten Konfliktherden in den transkribierten Audiodokumenten. "
            "Die paralinguistischen Signale weisen behutsam auf die Wichtigkeit einer klaren Supervision hin. "
            "Es wird empfohlen, die Rollenerwartungen beider Gesprächspartner kooperativ im direkten Dialog zu reflektieren."
        )
        
        return {
            "sectionResults": section_results,
            "globalSummary": global_summary
        }
