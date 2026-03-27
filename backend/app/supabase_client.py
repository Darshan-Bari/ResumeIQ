import logging
import os
import re
import time
import uuid
from typing import Any, Dict, Optional

from supabase import create_client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024

# Load environment variables from .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

SUPABASE_CONFIG_ERROR = ""
if not SUPABASE_URL:
    SUPABASE_CONFIG_ERROR = "Missing SUPABASE_URL environment variable"
elif not SUPABASE_KEY:
    SUPABASE_CONFIG_ERROR = "Missing SUPABASE_KEY environment variable"

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if not SUPABASE_CONFIG_ERROR else None
except Exception as exc:
    supabase = None
    SUPABASE_CONFIG_ERROR = f"Failed to initialize Supabase client: {exc}"


def _is_pdf(file_path: str, original_file_name: str) -> bool:
    path_pdf = file_path.lower().endswith(".pdf")
    name_pdf = (original_file_name or "").lower().endswith(".pdf")
    return path_pdf or name_pdf


def _normalize_input_file_name(file_name: Any) -> str:
    if not isinstance(file_name, str):
        return ""
    return file_name.strip()


def safe_filename(name: str) -> str:
    """Return ASCII-safe filename accepted by HTTP headers and storage paths."""
    normalized = _normalize_input_file_name(name) or "resume.pdf"

    # Remove non-ascii characters to avoid httpx header/path encoding failures.
    ascii_name = normalized.encode("ascii", "ignore").decode()
    ascii_name = ascii_name.replace(" ", "_")
    ascii_name = re.sub(r"[^a-zA-Z0-9._-]", "", ascii_name)
    ascii_name = ascii_name.strip("._-")

    if not ascii_name:
        return "resume.pdf"

    root, ext = os.path.splitext(ascii_name)
    extension = ext.lower()
    if extension != ".pdf":
        extension = ".pdf"
    if not root:
        root = "resume"

    return f"{root}{extension}"


def _build_unique_file_name(original_file_name: str) -> str:
    sanitized = safe_filename(original_file_name)
    root, ext = os.path.splitext(sanitized)
    extension = ext if ext else ".pdf"
    timestamp = int(time.time())
    suffix = uuid.uuid4().hex
    return f"{timestamp}_{suffix}_{root}{extension}"


def _validate_file(file_path: str, original_file_name: str) -> Optional[str]:
    normalized_name = _normalize_input_file_name(original_file_name)
    if not file_path:
        return "File path is required"
    if not os.path.exists(file_path):
        return "Uploaded file not found"
    if not os.path.isfile(file_path):
        return "Invalid file path"
    if not normalized_name:
        return "Original file name is required"
    if not _is_pdf(file_path, normalized_name):
        return "Only PDF files are allowed"

    file_size = os.path.getsize(file_path)
    if file_size == 0:
        return "Uploaded PDF is empty"
    if file_size > MAX_PDF_SIZE_BYTES:
        return "PDF file size exceeds 5MB limit"
    return None


def upload_resume_to_supabase(
    file_path: str,
    original_file_name: str,
    candidate_name: str = "",
    parser: Any = None,
) -> Dict[str, Any]:
    """Upload a resume PDF to Supabase and parse it via ResumeParser.

    Returns structured response:
    {
      "success": bool,
      "file_name": str,
      "public_url": str,
      "parsed_data": dict,
      "error": str
    }
    """
    normalized_name = _normalize_input_file_name(original_file_name)
    validation_error = _validate_file(file_path, normalized_name)
    if validation_error:
        logger.warning("Resume upload rejected: %s", validation_error)
        return {
            "success": False,
            "file_name": "",
            "public_url": "",
            "parsed_data": {},
            "error": validation_error,
        }

    if supabase is None:
        logger.error("Supabase client unavailable: %s", SUPABASE_CONFIG_ERROR)
        return {
            "success": False,
            "file_name": "",
            "public_url": "",
            "parsed_data": {},
            "error": SUPABASE_CONFIG_ERROR or "Supabase client unavailable",
        }

    sanitized_name = safe_filename(normalized_name)
    file_name = _build_unique_file_name(sanitized_name)

    logger.info("Original file name: %s", normalized_name)
    logger.info("Sanitized file name: %s", sanitized_name)

    try:
        with open(file_path, "rb") as f:
            supabase.storage.from_("resumes").upload(
                file_name,
                f,
                {"content-type": "application/pdf"}
            )

        public_url = supabase.storage.from_("resumes").get_public_url(file_name)["publicUrl"]
        logger.info("Resume upload successful: %s", file_name)

        parser_obj = parser
        if parser_obj is None:
            from app.resume_parser import ResumeParser

            parser_obj = ResumeParser()

        parsed_data = parser_obj.parse_resume(file_path, candidate_name)
        if parsed_data.get("error"):
            logger.warning("Resume parsed with error for %s: %s", file_name, parsed_data.get("error"))
            return {
                "success": False,
                "file_name": file_name,
                "public_url": public_url,
                "parsed_data": parsed_data,
                "error": parsed_data.get("error", "Resume parsing failed"),
            }

        return {
            "success": True,
            "file_name": file_name,
            "public_url": public_url,
            "parsed_data": parsed_data,
            "error": "",
        }

    except FileNotFoundError:
        logger.exception("Resume upload failed: file not found")
        return {
            "success": False,
            "file_name": file_name,
            "public_url": "",
            "parsed_data": {},
            "error": "Resume file not found during upload",
        }
    except PermissionError:
        logger.exception("Resume upload failed: permission denied")
        return {
            "success": False,
            "file_name": file_name,
            "public_url": "",
            "parsed_data": {},
            "error": "Permission denied while reading resume file",
        }
    except ValueError as exc:
        logger.exception("Resume upload failed with validation error")
        return {
            "success": False,
            "file_name": file_name,
            "public_url": "",
            "parsed_data": {},
            "error": str(exc),
        }
    except Exception:
        logger.exception("Supabase upload failed for file: %s", file_name)
        return {
            "success": False,
            "file_name": file_name,
            "public_url": "",
            "parsed_data": {},
            "error": "Upload failed",
        }