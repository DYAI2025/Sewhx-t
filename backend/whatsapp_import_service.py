import os
import zipfile
import shutil
import tempfile
import uuid
from typing import List, Dict, Any, Tuple

class WhatsAppImportService:
    def __init__(self, base_upload_dir: str = None):
        if base_upload_dir is None:
            self.base_upload_dir = tempfile.gettempdir()
        else:
            self.base_upload_dir = base_upload_dir
        os.makedirs(self.base_upload_dir, exist_ok=True)

    def generate_session_id(self) -> str:
        return str(uuid.uuid4())

    def get_session_dir(self, session_id: str) -> str:
        session_dir = os.path.join(self.base_upload_dir, "sessions", session_id)
        os.makedirs(session_dir, exist_ok=True)
        return session_dir

    def extract_zip_securely(self, zip_path: str, extract_to_dir: str) -> List[str]:
        """
        Extracts ZIP archive safely, protecting against Zip-Slip path traversal vulnerability.
        Returns a list of extracted file relative paths.
        """
        extracted_files = []
        os.makedirs(extract_to_dir, exist_ok=True)
        
        target_abs = os.path.abspath(extract_to_dir)

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for member in zip_ref.infolist():
                # Block directory traversal sequences ('../' or absolute roots)
                fullname = member.filename
                # Solve target path
                member_abs = os.path.abspath(os.path.join(target_abs, fullname))
                
                # Verify that the member target is strictly inside our extraction target
                if not member_abs.startswith(target_abs + os.sep) and member_abs != target_abs:
                    # Skip or throw exception for hazardous entries
                    continue
                
                # Extract if it is not a directory itself
                if not member.is_dir():
                    # Create parent dir if required
                    os.makedirs(os.path.dirname(member_abs), exist_ok=True)
                    with zip_ref.open(member) as source, open(member_abs, 'wb') as target:
                        shutil.copyfileobj(source, target)
                    
                    rel_path = os.path.relpath(member_abs, target_abs)
                    extracted_files.append(rel_path)
                    
        return extracted_files

    def import_raw_files(self, session_id: str, files_info: List[Tuple[str, bytes]]) -> Dict[str, Any]:
        """
        Accepts uploaded files, saves them inside the session directory, and unpacks zip files if discovered.
        """
        session_dir = self.get_session_dir(session_id)
        saved_paths = []
        
        for name, content in files_info:
            # Clean base name
            safe_name = os.path.basename(name)
            target_file_path = os.path.join(session_dir, safe_name)
            
            with open(target_file_path, "wb") as f:
                f.write(content)
            
            if safe_name.lower().endswith(".zip"):
                # Extract zip securely
                unzipped_subdir = os.path.join(session_dir, "extracted")
                extracted = self.extract_zip_securely(target_file_path, unzipped_subdir)
                for ext_file in extracted:
                    saved_paths.append({
                        "original_name": ext_file,
                        "stored_path": os.path.join("extracted", ext_file),
                        "file_size": os.path.getsize(os.path.join(unzipped_subdir, ext_file))
                    })
            else:
                saved_paths.append({
                    "original_name": safe_name,
                    "stored_path": safe_name,
                    "file_size": len(content)
                })
                
        return {
            "session_id": session_id,
            "directory": session_dir,
            "manifest": saved_paths
        }
