import re
import datetime
from typing import List, Dict, Any

class ChatParser:
    """
    Parses WhatsApp .txt logs, accounts for multiline messages, and spots references
    to media attachment names in the conversation.
    """
    
    # Common formats:
    # 1. [29.06.25, 13:15:22] Ben: Hello
    # 2. 29.06.25, 13:15 - Ben: Hello
    # 3. [29/06/2025, 13:15] Zoe: Hi
    # 4. 29/06/2025, 13:15:22 - Zoe: Hi
    
    LINE_PATTERNS = [
        # Bracket format: [29.06.25, 13:15:22] Sender: Message
        re.compile(r'^\[?(\d{2}\.\d{2}\.\d{2,4}),\s*(\d{2}:\d{2}(?::\d{2})?)\]?\s*-?\s*([^:]+):\s*(.*)', re.IGNORECASE),
        # Slash format: 29/06/2025, 13:15 - Sender: Message
        re.compile(r'^(\d{2}/\d{2}/\d{2,4}),\s*(\d{2}:\d{2}(?::\d{2})?)\s*-\s*([^:]+):\s*(.*)', re.IGNORECASE),
        # Dash format: 29.06.25, 13:15 - Sender: Message
        re.compile(r'^(\d{2}\.\d{2}\.\d{2,4}),\s*(\d{2}:\d{2}(?::\d{2})?)\s*-\s*([^:]+):\s*(.*)', re.IGNORECASE)
    ]

    # Media reference formats inside messages:
    # - <Audio weggelassen>
    # - <Anhang: PTT-20250629-WA0001.opus>
    # - PTT-20250629-WA0001.opus (Datei angehängt)
    MEDIA_REF_PATTERNS = [
        re.compile(r'<(?:Anhang:\s*)?([a-zA-Z0-9_\-\.\s]+\.[a-zA-Z0-9]{3,4})>', re.IGNORECASE),
        re.compile(r'([a-zA-Z0-9_\-\.\s]+\.[a-zA-Z0-9]{3,4})\s*\(Datei angehängt\)', re.IGNORECASE),
        re.compile(r'([a-zA-Z0-9_\-\.\s]+\.[a-zA-Z0-9]{3,4})\s*weggelassen', re.IGNORECASE),
        # WhatsApp audio ptt format
        re.compile(r'(PTT-\d{8}-WA\d+\.[a-zA-Z0-9]+)', re.IGNORECASE),
        re.compile(r'(AUDIO-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.[a-zA-Z0-9]+)', re.IGNORECASE)
    ]

    def parse_time(self, date_str: str, time_str: str) -> str:
        """
        Converts parsed date and time strings to standard ISO 8601 format.
        """
        try:
            # Normalize day/month/year separators
            sep = '.' if '.' in date_str else '/'
            parts = date_str.split(sep)
            
            day = int(parts[0])
            month = int(parts[1])
            year_part = parts[2]
            
            if len(year_part) == 2:
                year = 2000 + int(year_part)
            else:
                year = int(year_part)
                
            time_parts = time_str.split(':')
            hour = int(time_parts[0])
            minute = int(time_parts[1])
            second = int(time_parts[2]) if len(time_parts) > 2 else 0
            
            dt = datetime.datetime(year, month, day, hour, minute, second)
            return dt.isoformat() + "Z"
        except Exception:
            # Fallback current ISO or default
            return datetime.datetime.now().isoformat() + "Z"

    def match_line(self, line: str) -> Dict[str, Any]:
        for pattern in self.LINE_PATTERNS:
            match = pattern.match(line)
            if match:
                date_part, time_part, sender, text = match.groups()
                timestamp = self.parse_time(date_part, time_part)
                return {
                    "timestamp": timestamp,
                    "sender": sender.strip(),
                    "text": text.strip()
                }
        return None

    def parse(self, file_content: str, filename: str = "chat.txt") -> List[Dict[str, Any]]:
        if not file_content:
            return []
            
        messages = []
        lines = file_content.splitlines()
        
        for line_no, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            parsed = self.match_line(line)
            if parsed:
                # Detect media attachments referenced in this line
                referenced_media = []
                for p in self.MEDIA_REF_PATTERNS:
                    matches = p.findall(parsed["text"])
                    for m in matches:
                        if m not in referenced_media:
                            referenced_media.append(m)
                
                messages.append({
                    "id": f"wa-msg-{line_no}-{uuid_fragment()}",
                    "timestamp": parsed["timestamp"],
                    "sender": parsed["sender"],
                    "type": "text",
                    "text": parsed["text"],
                    "referenced_media": referenced_media,
                    "source": {
                        "kind": "whatsapp_export",
                        "fileName": filename
                    }
                })
            else:
                # This could be a continuation of the previous message
                if messages:
                    messages[-1]["text"] += "\n" + line
                    # Recheck references inside the updated text as well
                    for p in self.MEDIA_REF_PATTERNS:
                        matches = p.findall(line)
                        for m in matches:
                            if m not in messages[-1]["referenced_media"]:
                                messages[-1]["referenced_media"].append(m)
                                
        return messages

def uuid_fragment() -> str:
    import uuid
    return str(uuid.uuid4())[:8]
