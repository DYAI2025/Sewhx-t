import json
from typing import Dict, Any

class ExportService:
    """
    Handles file assembly and exports for MergedChatDocument and AnalysisResult objects.
    Ensures complete, standard outputs in JSON, TXT, Markdown, and beautiful HTML layouts.
    """
    
    def export_merged_only(self, document: Dict[str, Any], fmt: str) -> Dict[str, Any]:
        """
        Exports the merged document WITHOUT requiring any analysis results (Product Principle!).
        """
        title = document.get("title", "WordThread Merged")
        participants = document.get("participants", [])
        messages = document.get("messages", [])
        sections = document.get("sections", [])
        
        if fmt == "json":
            content = json.dumps(document, indent=2, ensure_ascii=False)
            mime = "application/json"
            ext = "json"
        elif fmt == "txt":
            # Simple readable text log
            lines = [f"=== {title.upper()} ===", f"Teilnehmer: {', '.join(participants)}", ""]
            for m in messages:
                typ = "[Audio]" if m.get("type") == "audio_transcript" else "[Text]"
                lines.append(f"[{m['timestamp']}] {m['sender']} {typ}: {m['text']}")
            content = "\n".join(lines)
            mime = "text/plain"
            ext = "txt"
        elif fmt == "markdown":
            md = [f"# {title}", f"- **Teilnehmer**: {', '.join(participants)}", ""]
            for sec in sections:
                md.append(f"## {sec['title']}")
                md.append(f"*Dauer: {sec['startTimestamp']} - {sec['endTimestamp']}*")
                if sec.get("summary"):
                    md.append(f"> {sec['summary']}")
                md.append("")
                
                sec_id = sec["id"]
                for m in messages:
                    if m.get("sectionId") == sec_id:
                        typ = "*[Sprachnachricht]*" if m.get("type") == "audio_transcript" else ""
                        md.append(f"**{m['sender']}** ({m['timestamp']}) {typ}:  \n{m['text']}\n")
            content = "\n".join(md)
            mime = "text/markdown"
            ext = "md"
        else:
            # Simple HTML view
            html = [
                "<!DOCTYPE html>",
                "<html>",
                "<head>",
                "  <meta charset='utf-8'>",
                f"  <title>{title}</title>",
                "  <style>",
                "    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; background: #fafafa; }",
                "    .message { background: white; padding: 16px; border-radius: 12px; margin-bottom: 12px; border: 1px solid #eef; }",
                "    .sender { font-weight: bold; color: #111; }",
                "    .timestamp { font-size: 11px; color: #888; margin-left: 8px; }",
                "    .tag { font-size: 9px; padding: 2px 6px; background: #e0fcfc; color: #00cfcc; font-weight: bold; border-radius: 99px; }",
                "  </style>",
                "</head>",
                "<body>",
                f"  <h1>{title}</h1>",
                f"  <p><strong>Teilnehmer:</strong> {', '.join(participants)}</p>"
            ]
            for m in messages:
                tag_label = "Audio" if m.get("type") == "audio_transcript" else "Text"
                html.append(f"  <div class='message'>")
                html.append(f"    <div><span class='sender'>{m['sender']}</span><span class='timestamp'>{m['timestamp']}</span> <span class='tag'>{tag_label}</span></div>")
                html.append(f"    <p style='margin-top: 8px;'>{m['text']}</p>")
                html.append(f"  </div>")
            html.append("</body></html>")
            content = "\n".join(html)
            mime = "text/html"
            ext = "html"
            
        filename = f"reconstructed_chat_{document['id']}.{ext}"
        return {
            "content": content,
            "mimeType": mime,
            "fileName": filename
        }

    def export_analysis(self, document: Dict[str, Any], analysis: Dict[str, Any], fmt: str) -> Dict[str, Any]:
        """
        Exports structured analysis results with rich details.
        """
        title = document.get("title", "WordThread Co-Analyzer Report")
        participants = document.get("participants", [])
        
        if fmt == "json":
            data = {"document": document, "analysis": analysis}
            content = json.dumps(data, indent=2, ensure_ascii=False)
            mime = "application/json"
            ext = "json"
        elif fmt == "markdown":
            md = [
                f"# Semiotischer Analysebericht: {title}",
                f"- **Gesprächsteilnehmer**: {', '.join(participants)}",
                f"- **Globaler Befund**: {analysis.get('globalSummary')}",
                ""
            ]
            md.append("## Marker-Treffer")
            for mc in analysis.get("markerCounts", []):
                md.append(f"### {mc['label']}: {mc['count']} Treffer")
                for sp, count in mc.get("bySpeaker", {}).items():
                    md.append(f"- **{sp}**: {count} Treffer")
            
            md.append("\n## Detailierte Abschnitte")
            for res in analysis.get("sectionResults", []):
                sec_id = res["sectionId"]
                sec = next((s for s in document.get("sections", []) if s["id"] == sec_id), {})
                md.append(f"### {sec.get('title', sec_id)}")
                md.append(f"- **Zusammenfassung**: {res.get('summary')}")
                md.append("\n**Resonanz-Deutungen:**")
                for m in res.get("semanticMeaning", []):
                    md.append(f"- {m}")
                md.append("\n**Diskursive Signale:**")
                for m in res.get("semioticSignals", []):
                    md.append(f"- {m}")
                md.append("\n**Systemisches Deutungsangebot:**")
                for m in res.get("possibleInterpretations", []):
                    md.append(f"- *{m}*")
                md.append("")
                
            content = "\n".join(md)
            mime = "text/markdown"
            ext = "md"
        else:
            # Custom styled report HTML
            from src.lib.mockServices import exportDocument
            # In python we can emit a rich HTML with embedded styles too
            html = [
                "<!DOCTYPE html>",
                "<html>",
                "<head>",
                "  <meta charset='utf-8'>",
                f"  <title>Analysebericht: {title}</title>",
                "  <style>",
                "    body { font-family: sans-serif; max-width: 900px; margin: 40px auto; padding: 24px; line-height: 1.6; background: #f8fafc; color: #1e293b; }",
                "    .card { background: white; padding: 32px; border-radius: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); margin-bottom: 24px; border: 1px solid #f1f5f9; }",
                "    .header { background: #0f172a; color: white; border-radius: 24px; padding: 40px; margin-bottom: 32px; }",
                "    h1 { margin: 0 0 12px 0; }",
                "    .indicator { display: inline-block; padding: 4px 12px; border-radius: 99px; font-weight: bold; background: #e0fcfc; color: #00cfcc; font-size: 11px; }",
                "  </style>",
                "</head>",
                "<body>",
                "  <div class='header'>",
                "    <span class='indicator'>Semiotischer Detailbericht</span>",
                f"    <h1 style='margin-top: 12px;'>{title}</h1>",
                f"    <p>Teilnehmer: {', '.join(participants)}</p>",
                "  </div>",
                "  <div class='card'>",
                "    <h2>Globaler Forschungsansatz</h2>",
                f"    <p style='font-size: 16px; font-style: italic; color: #334155; border-left: 4px solid #00cfcc; padding-left: 16px;'>{analysis.get('globalSummary')}</p>",
                "  </div>",
                "  <div class='card'>",
                "    <h2>Systemische Deutungsangebote pro Abschnitt</h2>"
            ]
            for res in analysis.get("sectionResults", []):
                sec_id = res["sectionId"]
                sec = next((s for s in document.get("sections", []) if s["id"] == sec_id), {})
                html.append(f"    <div style='margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;'>")
                html.append(f"      <h3 style='color: #0d9488;'>{sec.get('title', sec_id)}</h3>")
                html.append(f"      <p><strong>Fokus:</strong> {res.get('summary')}</p>")
                
                html.append("      <h4 style='margin-top: 12px;'>Semiotische Resonanz</h4><ul>")
                for sem in res.get("semanticMeaning", []):
                    html.append(f"        <li>{sem}</li>")
                html.append("      </ul>")
                
                html.append("      <h4 style='margin-top: 12px;'>Hypothetisches Deutungsangebot</h4><ul>")
                for inter in res.get("possibleInterpretations", []):
                    html.append(f"        <li><em>{inter}</em></li>")
                html.append("      </ul>")
                html.append("    </div>")
            html.append("  </div>")
            html.append("</body></html>")
            
            content = "\n".join(html)
            mime = "text/html"
            ext = "html"
            
        filename = f"semiotic_analysis_{analysis.get('id', 'rep')}.{ext}"
        return {
            "content": content,
            "mimeType": mime,
            "fileName": filename
        }
