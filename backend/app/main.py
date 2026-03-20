"""ResumeIQ Flask API with candidate and admin authentication."""

import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Any, Dict, Optional

import bcrypt
import jwt
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from flask import send_from_directory
from werkzeug.utils import secure_filename

from app.matching_engine import MatchingEngine
from app.resume_parser import ResumeParser
from app.storage import Storage

app = Flask(__name__)
load_dotenv()

frontend_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in frontend_origins.split(",") if origin.strip()]
CORS(
    app,
    resources={r"/api/*": {"origins": allowed_origins}},
    supports_credentials=False,
)

app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "..", "uploads")
app.config["DATA_FOLDER"] = os.path.join(os.path.dirname(__file__), "..", "data")
app.config["JWT_SECRET"] = os.getenv("JWT_SECRET", "resumeiq-dev-secret-change-me")
app.config["JWT_ALGORITHM"] = "HS256"
app.config["JWT_EXPIRY_HOURS"] = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["DATA_FOLDER"], exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf"}

parser = ResumeParser()
matcher = MatchingEngine()
storage = Storage(os.path.join(app.config["DATA_FOLDER"], "resumeiq.db"))


def _ensure_default_admin() -> None:
    admin_email = os.getenv("ADMIN_EMAIL", "admin@resumeiq").strip().lower()
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123")
    existing = storage.get_user_by_email(admin_email)
    if existing:
        if existing.get("role") != "admin":
            storage.update_user(existing["user_id"], {"role": "admin"})
        return

    storage.create_user(
        {
            "user_id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": _hash_password(admin_password),
            "role": "admin",
        }
    )


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def _generate_token(user: Dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["user_id"],
        "email": user["email"],
        "role": user.get("role", "candidate"),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=app.config["JWT_EXPIRY_HOURS"])).timestamp()),
    }
    return jwt.encode(payload, app.config["JWT_SECRET"], algorithm=app.config["JWT_ALGORITHM"])


def _extract_token() -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None


def _decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, app.config["JWT_SECRET"], algorithms=[app.config["JWT_ALGORITHM"]])
    except Exception:
        return None


def _build_auth_payload(user: Dict[str, Any]) -> Dict[str, Any]:
    token = _generate_token(user)
    return {
        "token": token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user.get("role", "candidate"),
            "candidate_id": user.get("candidate_id"),
            "is_approved": bool(user.get("is_approved", False)),
        },
    }


def require_auth(role: Optional[str] = None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            token = _extract_token()
            if not token:
                return jsonify({"error": "Authorization token required"}), 401

            decoded = _decode_token(token)
            if not decoded:
                return jsonify({"error": "Invalid or expired token"}), 401

            user = storage.get_user_by_id(decoded.get("sub", ""))
            if not user:
                return jsonify({"error": "User not found"}), 401

            if role and user.get("role") != role:
                return jsonify({"error": "Access denied"}), 403

            g.current_user = user
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def _candidate_response(candidate: Dict[str, Any]) -> Dict[str, Any]:
    file_name = candidate.get("file_name", "")
    resume_url = f"/api/uploads/{file_name}" if file_name else ""
    return {
        "candidate_id": candidate.get("candidate_id", ""),
        "candidate_name": candidate.get("candidate_name", ""),
        "skills": candidate.get("skills", []),
        "education": candidate.get("education", []),
        "experience": candidate.get("experience", []),
        "projects": candidate.get("projects", []),
        "links": candidate.get("links", []),
        "contact": candidate.get("contact", {}),
        "coding_profiles": candidate.get("coding_profiles", {}),
        "profile_insights": {},
        "profile_status": {},
        "resume_file_name": file_name,
        "resume_url": resume_url,
        "created_at": candidate.get("created_at"),
        "updated_at": candidate.get("updated_at"),
    }


def _resolve_candidate_user_from_upload(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    token = _extract_token()
    if token:
        decoded = _decode_token(token)
        if decoded:
            current_user = storage.get_user_by_id(decoded.get("sub", ""))
            if current_user and current_user.get("role") == "candidate":
                return {"user": current_user, "generated_password": ""}

    form_email = (request.form.get("email") or "").strip().lower()
    parsed_email = ((parsed_data.get("contact") or {}).get("email") or "").strip().lower()
    email = form_email or parsed_email
    password = (request.form.get("password") or "").strip()

    if not email:
        raise ValueError("Email is required. Provide email during upload or include it in the resume.")

    existing_user = storage.get_user_by_email(email)
    if existing_user:
        if existing_user.get("role") != "candidate":
            raise ValueError("This email belongs to a non-candidate account.")
        if not password:
            raise ValueError("Password required for existing account.")
        if not _verify_password(password, existing_user.get("password_hash", "")):
            raise ValueError("Invalid credentials for existing account.")
        return {"user": existing_user, "generated_password": ""}

    generated_password = password or secrets.token_urlsafe(10)
    new_user = storage.create_user(
        {
            "user_id": str(uuid.uuid4()),
            "email": email,
            "password_hash": _hash_password(generated_password),
            "role": "candidate",
        }
    )
    return {"user": new_user, "generated_password": generated_password if not password else ""}


# ==================== AUTH ENDPOINTS ====================

@app.route("/signup", methods=["POST"])
@app.route("/api/signup", methods=["POST"])
@app.route("/api/auth/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        existing = storage.get_user_by_email(email)
        if existing:
            return jsonify({"error": "User already exists. Please login."}), 409

        user = storage.create_user(
            {
                "user_id": str(uuid.uuid4()),
                "email": email,
                "password_hash": _hash_password(password),
                "role": data.get("role", "candidate") if data.get("role") == "admin" else "candidate",
            }
        )
        return jsonify({**_build_auth_payload(user), "message": "Signup successful"}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/login", methods=["POST"])
@app.route("/api/login", methods=["POST"])
@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()
        role = data.get("role")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = storage.get_user_by_email(email)
        if not user or not _verify_password(password, user.get("password_hash", "")):
            return jsonify({"error": "Invalid email or password"}), 401

        if role and user.get("role") != role:
            return jsonify({"error": "Invalid role for this account"}), 403

        storage.update_user(user["user_id"], {"last_login_at": datetime.utcnow().isoformat()})
        refreshed = storage.get_user_by_id(user["user_id"])
        return jsonify({**_build_auth_payload(refreshed), "message": "Login successful"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/auth/me", methods=["GET"])
@require_auth()
def get_me():
    user = g.current_user
    candidate = storage.get_candidate_by_user(user["user_id"]) if user.get("role") == "candidate" else None
    return jsonify(
        {
            "user": {
                "user_id": user["user_id"],
                "email": user["email"],
                "role": user.get("role", "candidate"),
                "candidate_id": user.get("candidate_id"),
                "is_approved": bool(user.get("is_approved", False)),
            },
            "candidate": _candidate_response(candidate) if candidate else None,
        }
    )


@app.route("/api/recruiter/signup", methods=["POST"])
def recruiter_signup():
    try:
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        existing = storage.get_user_by_email(email)
        if existing:
            return jsonify({"error": "User already exists. Please login."}), 409

        user = storage.create_user(
            {
                "user_id": str(uuid.uuid4()),
                "email": email,
                "password_hash": _hash_password(password),
                "role": "recruiter",
                "is_approved": False,
            }
        )
        return jsonify({**_build_auth_payload(user), "message": "Recruiter signup successful. Your account is under review"}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/recruiter/login", methods=["POST"])
def recruiter_login():
    try:
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = storage.get_user_by_email(email)
        if not user or user.get("role") != "recruiter":
            return jsonify({"error": "Recruiter account not found"}), 404
        if not _verify_password(password, user.get("password_hash", "")):
            return jsonify({"error": "Invalid email or password"}), 401

        storage.update_user(user["user_id"], {"last_login_at": datetime.utcnow().isoformat()})
        refreshed = storage.get_user_by_id(user["user_id"])
        if refreshed and not refreshed.get("is_approved", False):
            return jsonify({**_build_auth_payload(refreshed), "message": "Your account is under review"}), 200
        return jsonify({**_build_auth_payload(refreshed), "message": "Recruiter login successful"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ==================== CANDIDATE ENDPOINTS ====================

@app.route("/api/candidate/upload-resume", methods=["POST"])
def upload_resume():
    try:
        if "resume" not in request.files:
            return jsonify({"error": "No resume file provided"}), 400

        file = request.files["resume"]
        candidate_name = (request.form.get("candidate_name") or "Unknown").strip()
        links_for_fetch = {
            "github": (request.form.get("github", "") or "").strip(),
            "leetcode": (request.form.get("leetcode", "") or "").strip(),
            "codeforces": (request.form.get("codeforces", "") or "").strip(),
            "codechef": (request.form.get("codechef", "") or "").strip(),
        }

        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "Only PDF files are allowed"}), 400

        temp_candidate_id = str(uuid.uuid4())
        temp_filename = f"{temp_candidate_id}_{secure_filename(file.filename)}"
        temp_filepath = os.path.join(app.config["UPLOAD_FOLDER"], temp_filename)
        file.save(temp_filepath)

        parsed_data = parser.parse_resume(temp_filepath, candidate_name)

        user_resolution = _resolve_candidate_user_from_upload(parsed_data)
        user = user_resolution["user"]
        generated_password = user_resolution["generated_password"]

        existing_candidate = storage.get_candidate_by_user(user["user_id"])
        candidate_id = existing_candidate["candidate_id"] if existing_candidate else str(uuid.uuid4())
        final_filename = f"{candidate_id}_{secure_filename(file.filename)}"
        final_filepath = os.path.join(app.config["UPLOAD_FOLDER"], final_filename)
        if os.path.abspath(temp_filepath) != os.path.abspath(final_filepath):
            os.replace(temp_filepath, final_filepath)

        if existing_candidate and existing_candidate.get("file_path") and os.path.exists(existing_candidate["file_path"]):
            old_path = existing_candidate["file_path"]
            if os.path.abspath(old_path) != os.path.abspath(final_filepath):
                try:
                    os.remove(old_path)
                except OSError:
                    pass

        parsed_data["candidate_id"] = candidate_id
        parsed_data["file_path"] = final_filepath
        parsed_data["file_name"] = final_filename

        parsed_data["contact"] = {
            **(parsed_data.get("contact", {}) or {}),
            "email": (request.form.get("email") or (parsed_data.get("contact") or {}).get("email") or user["email"]),
            "github": links_for_fetch.get("github", ""),
        }
        parsed_data["coding_profiles"] = {
            "github": links_for_fetch.get("github", ""),
            "leetcode": links_for_fetch.get("leetcode", ""),
            "codeforces": links_for_fetch.get("codeforces", ""),
            "codechef": links_for_fetch.get("codechef", ""),
        }
        parsed_data["profile_insights"] = {}
        parsed_data["profile_status"] = {}

        storage.upsert_candidate(parsed_data, user_id=user["user_id"])
        user = storage.get_user_by_id(user["user_id"]) or user

        response_data = {
            "candidate_id": candidate_id,
            "candidate_name": parsed_data.get("candidate_name", candidate_name),
            "skills": parsed_data.get("skills", []),
            "education": parsed_data.get("education", []),
            "experience": parsed_data.get("experience", []),
            "projects": parsed_data.get("projects", []),
            "links": parsed_data.get("links", []),
            "estimated_experience_years": parsed_data.get("estimated_experience_years", 0),
            "contact": parsed_data.get("contact", {}),
            "coding_profiles": parsed_data.get("coding_profiles", {}),
            "profile_status": {},
            "extracted_info": {
                "name": parsed_data.get("candidate_name", candidate_name),
                "email": parsed_data.get("contact", {}).get("email", ""),
                "phone": parsed_data.get("contact", {}).get("phone", ""),
                "education": parsed_data.get("education", []),
                "skills": parsed_data.get("skills", []),
                "projects": parsed_data.get("projects", []),
                "experience": parsed_data.get("experience", []),
                "links": parsed_data.get("links", []),
            },
            "auth": _build_auth_payload(user),
            "generated_password": generated_password,
            "message": "Resume parsed successfully",
        }
        return jsonify(response_data), 200

    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/candidate/profile", methods=["POST", "PUT"])
@require_auth(role="candidate")
def save_candidate_profile():
    try:
        data = request.get_json() or {}
        if "candidate_name" not in data or not data.get("candidate_name", "").strip():
            return jsonify({"error": "Candidate name is required"}), 400

        user = g.current_user
        existing_candidate = storage.get_candidate_by_user(user["user_id"])
        candidate_id = existing_candidate["candidate_id"] if existing_candidate else str(uuid.uuid4())

        coding_profiles = {
            "github": (data.get("github", "") or "").strip(),
            "leetcode": (data.get("leetcode", "") or "").strip(),
            "codechef": (data.get("codechef", "") or "").strip(),
            "codeforces": (data.get("codeforces", "") or "").strip(),
        }

        profile_data = {
            "candidate_id": candidate_id,
            "candidate_name": data.get("candidate_name", "").strip(),
            "contact": {
                "email": (data.get("email") or user.get("email") or "").strip(),
                "phone": data.get("phone", "").strip(),
                "linkedin": data.get("linkedin", "").strip(),
                "github": coding_profiles["github"],
            },
            "coding_profiles": coding_profiles,
            "skills": data.get("skills", []),
            "education": data.get("education", []),
            "experience": data.get("experience", []),
            "projects": data.get("projects", []),
            "estimated_experience_years": data.get("estimated_experience_years", 0),
            "full_text": " ".join(
                [
                    data.get("candidate_name", ""),
                    " ".join(data.get("skills", [])),
                    " ".join(
                        [
                            e.get("degree", "")
                            for e in data.get("education", [])
                            if isinstance(e, dict)
                        ]
                    ),
                    " ".join(
                        [
                            e.get("role", "")
                            for e in data.get("experience", [])
                            if isinstance(e, dict)
                        ]
                    ),
                ]
            ),
            "profile_insights": {},
            "profile_status": {},
            "is_manual_entry": True,
        }

        if existing_candidate:
            profile_data["file_path"] = existing_candidate.get("file_path", "")
            profile_data["file_name"] = existing_candidate.get("file_name", "")

        storage.upsert_candidate(profile_data, user_id=user["user_id"])
        return jsonify(
            {
                "candidate_id": candidate_id,
                "profile_status": {},
                "message": "Profile saved successfully",
            }
        ), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/candidate/dashboard", methods=["GET"])
@require_auth(role="candidate")
def candidate_dashboard():
    candidate = storage.get_candidate_by_user(g.current_user["user_id"])
    if not candidate:
        return jsonify({"candidate": None, "message": "No resume/profile uploaded yet", "applied_jobs": []}), 200
    applied_jobs = storage.list_applied_jobs_for_user(g.current_user["user_id"])
    return jsonify({"candidate": _candidate_response(candidate), "applied_jobs": applied_jobs}), 200


@app.route("/api/candidate/jobs", methods=["GET"])
@require_auth(role="candidate")
def candidate_available_jobs():
    jobs = storage.list_available_jobs_for_user(g.current_user["user_id"])
    return jsonify({"jobs": jobs, "total_jobs": len(jobs)}), 200


@app.route("/api/candidate/jobs/<job_id>/apply", methods=["POST"])
@require_auth(role="candidate")
def candidate_apply_job(job_id: str):
    user = g.current_user
    job = storage.get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    candidate = storage.get_candidate_by_user(user["user_id"])
    if not candidate:
        return jsonify({"error": "Please complete your profile and upload resume before applying"}), 400

    match_result = matcher.calculate_match_score(
        candidate,
        job.get("job_description", ""),
        job.get("required_skills", []),
    )
    match_score = match_result.get("match_score", match_result.get("overall_score", 0))

    application = storage.create_application(
        user_id=user["user_id"],
        job_id=job_id,
        status="pending",
        match_score=match_score,
    )

    storage.set_job_candidates(job_id, [
        *{
            c.get("candidate_id")
            for c in storage.get_job_candidate_records(job_id)
            if c.get("candidate_id")
        },
        candidate["candidate_id"],
    ])
    storage.save_job_candidate_match(
        job_id,
        candidate["candidate_id"],
        match_score,
        match_result.get("matched_skills", []),
        match_result.get("missing_skills", []),
    )

    return jsonify(
        {
            "message": "Applied successfully",
            "application": application,
            "job": job,
            "status": application.get("status", "pending"),
            "match_score": application.get("match_score", 0),
        }
    ), 200


@app.route("/api/candidate/applied-jobs", methods=["GET"])
@require_auth(role="candidate")
def candidate_applied_jobs():
    applied_jobs = storage.list_applied_jobs_for_user(g.current_user["user_id"])
    return jsonify({"applied_jobs": applied_jobs, "total_applied": len(applied_jobs)}), 200


@app.route("/api/candidate/account", methods=["DELETE"])
@require_auth(role="candidate")
def delete_candidate_account():
    user = g.current_user
    candidate = storage.get_candidate_by_user(user["user_id"])
    if candidate:
        if candidate.get("file_path") and os.path.exists(candidate["file_path"]):
            try:
                os.remove(candidate["file_path"])
            except OSError:
                pass
        storage.delete_candidate(candidate["candidate_id"], delete_user_link=False)

    storage.delete_user(user["user_id"])
    return jsonify({"message": "Candidate account deleted"}), 200


# ==================== RECRUITER ENDPOINTS ====================

@app.route("/api/recruiter/job/create", methods=["POST"])
@require_auth(role="recruiter")
def create_job():
    try:
        if not g.current_user.get("is_approved", False):
            return jsonify({"error": "Waiting for admin approval", "message": "Waiting for admin approval"}), 403

        data = request.get_json() or {}
        if "job_title" not in data or "job_description" not in data:
            return jsonify({"error": "Job title and description are required"}), 400

        job_id = str(uuid.uuid4())
        required_skills = data.get("required_skills", [])
        if not required_skills:
            required_skills = matcher.extract_job_skills(data.get("job_description", ""))

        created_by_user_id = g.current_user["user_id"]

        job_data = {
            "job_id": job_id,
            "created_by_user_id": created_by_user_id,
            "job_title": data.get("job_title", ""),
            "job_description": data.get("job_description", ""),
            "required_skills": required_skills,
            "company_name": data.get("company_name", ""),
            "location": data.get("location", ""),
            "created_at": datetime.utcnow().isoformat(),
        }

        storage.create_job(job_data)
        return jsonify({"job_id": job_id, "job": job_data, "message": "Job created successfully"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/recruiter/jobs", methods=["GET"])
def list_jobs():
    try:
        jobs = storage.list_jobs()
        return jsonify({"jobs": jobs, "total_jobs": len(jobs)}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/recruiter/job/match", methods=["POST"])
@require_auth(role="recruiter")
def match_candidates():
    try:
        data = request.get_json() or {}
        if not data:
            return jsonify({"error": "Request body required"}), 400

        job_id = data.get("job_id")
        if job_id:
            job_info = storage.get_job(job_id)
        else:
            job_info = None

        if job_info:
            job_description = job_info.get("job_description", "")
            required_skills = job_info.get("required_skills", [])
        else:
            job_description = data.get("job_description", "")
            required_skills = data.get("required_skills", [])

        if not job_description:
            return jsonify({"error": "Job description required"}), 400

        all_candidates = storage.list_candidates()
        candidate_lookup = {candidate["candidate_id"]: candidate for candidate in all_candidates}
        candidate_ids = data.get("candidate_ids", list(candidate_lookup.keys()))
        candidates_to_match = [candidate_lookup[cid] for cid in candidate_ids if cid in candidate_lookup]

        if not candidates_to_match:
            return jsonify({"error": "No valid candidates found"}), 400

        if job_id:
            storage.set_job_candidates(job_id, [candidate["candidate_id"] for candidate in candidates_to_match])

        ranked = matcher.rank_candidates(candidates_to_match, job_description)
        if job_id:
            for candidate in ranked:
                storage.save_job_candidate_match(
                    job_id,
                    candidate.get("candidate_id", ""),
                    candidate.get("match_score", candidate.get("overall_score", 0)),
                    candidate.get("matched_skills", []),
                    candidate.get("missing_skills", []),
                )

        return jsonify(
            {
                "job_id": job_id,
                "job_description_summary": job_description[:500] + "..."
                if len(job_description) > 500
                else job_description,
                "required_skills": required_skills if required_skills else matcher.extract_job_skills(job_description),
                "candidates": ranked,
                "total_candidates": len(ranked),
            }
        ), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/recruiter/candidates", methods=["GET"])
def get_all_candidates():
    try:
        all_candidates = storage.list_candidates()
        candidates_list = []
        for data in all_candidates:
            candidates_list.append(
                {
                    "candidate_id": data.get("candidate_id", ""),
                    "candidate_name": data.get("candidate_name", ""),
                    "skills": data.get("skills", []),
                    "contact": data.get("contact", {}),
                    "education": data.get("education", []),
                    "coding_profiles": data.get("coding_profiles", {}),
                    "profile_status": {},
                    "resume_url": _candidate_response(data).get("resume_url", ""),
                }
            )
        return jsonify({"candidates": candidates_list, "total_candidates": len(candidates_list)}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/recruiter/candidate/<candidate_id>", methods=["GET"])
def get_candidate_details(candidate_id: str):
    try:
        candidate = storage.get_candidate(candidate_id)
        if not candidate:
            return jsonify({"error": "Candidate not found"}), 404
        return jsonify(_candidate_response(candidate)), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/recruiter/dashboard", methods=["GET"])
@require_auth(role="recruiter")
def recruiter_dashboard():
    jobs = storage.list_jobs_by_creator(g.current_user["user_id"])
    result = []
    for job in jobs:
        candidates = storage.get_job_candidate_records(job["job_id"])
        candidates.sort(key=lambda item: item.get("match_score", 0), reverse=True)
        ranked_candidates = []
        for index, candidate in enumerate(candidates, 1):
            ranked_candidates.append(
                {
                    **_candidate_response(candidate),
                    "rank": index,
                    "match_score": candidate.get("match_score", 0),
                    "matched_skills": candidate.get("matched_skills", []),
                    "missing_skills": candidate.get("missing_skills", []),
                    "status": candidate.get("status", "pending"),
                    "shortlisted": bool(candidate.get("shortlisted", False)),
                }
            )
        result.append(
            {
                "job": job,
                "candidates": ranked_candidates,
            }
        )
    return jsonify({"jobs": result, "total_jobs": len(result)}), 200


@app.route("/api/recruiter/job/<job_id>/candidate/<candidate_id>/status", methods=["PUT"])
@require_auth(role="recruiter")
def recruiter_update_candidate_status(job_id: str, candidate_id: str):
    try:
        job = storage.get_job(job_id)
        if not job or job.get("created_by_user_id") != g.current_user["user_id"]:
            return jsonify({"error": "Job not found"}), 404

        data = request.get_json() or {}
        status = (data.get("status") or "").strip().lower()
        if status not in {"pending", "selected", "rejected"}:
            return jsonify({"error": "Status must be pending, selected, or rejected"}), 400

        updated = storage.update_job_candidate_status(job_id, candidate_id, status)
        if not updated:
            return jsonify({"error": "Candidate not attached to this job"}), 404
        storage.update_application_status_for_candidate(job_id, candidate_id, status)
        return jsonify({"message": "Candidate status updated", "status": status}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/recruiter/job/<job_id>/candidate/<candidate_id>/shortlist", methods=["PUT"])
@require_auth(role="recruiter")
def recruiter_update_candidate_shortlist(job_id: str, candidate_id: str):
    try:
        job = storage.get_job(job_id)
        if not job or job.get("created_by_user_id") != g.current_user["user_id"]:
            return jsonify({"error": "Job not found"}), 404

        data = request.get_json() or {}
        shortlisted = bool(data.get("shortlisted", True))
        updated = storage.update_job_candidate_shortlist(job_id, candidate_id, shortlisted)
        if not updated:
            return jsonify({"error": "Candidate not attached to this job"}), 404
        return jsonify({"message": "Candidate shortlist updated", "shortlisted": shortlisted}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ==================== ADMIN ENDPOINTS ====================

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    try:
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = storage.get_user_by_email(email)
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Admin account not found"}), 403
        if not _verify_password(password, user.get("password_hash", "")):
            return jsonify({"error": "Invalid email or password"}), 401

        storage.update_user(user["user_id"], {"last_login_at": datetime.utcnow().isoformat()})
        refreshed = storage.get_user_by_id(user["user_id"])
        return jsonify({**_build_auth_payload(refreshed), "message": "Admin login successful"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/admin/overview", methods=["GET"])
@require_auth(role="admin")
def admin_overview():
    stats = storage.get_stats()
    return jsonify(
        {
            "stats": {
                "total_candidates": stats.get("total_candidates", 0),
                "total_jobs": stats.get("total_jobs", 0),
                "total_users": stats.get("total_users", 0),
            }
        }
    ), 200


@app.route("/api/admin/candidates", methods=["GET"])
@require_auth(role="admin")
def admin_list_candidates():
    candidates = storage.list_candidates()
    return jsonify({"candidates": [_candidate_response(candidate) for candidate in candidates]}), 200


@app.route("/api/admin/candidates/<candidate_id>", methods=["DELETE"])
@require_auth(role="admin")
def admin_delete_candidate(candidate_id: str):
    candidate = storage.get_candidate(candidate_id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    if candidate.get("file_path") and os.path.exists(candidate["file_path"]):
        try:
            os.remove(candidate["file_path"])
        except OSError:
            pass

    storage.delete_candidate(candidate_id, delete_user_link=False)
    if candidate.get("user_id"):
        storage.delete_user(candidate["user_id"])
    return jsonify({"message": "Candidate deleted"}), 200


@app.route("/api/admin/jobs", methods=["GET"])
@require_auth(role="admin")
def admin_list_jobs():
    jobs = storage.list_jobs()
    return jsonify({"jobs": jobs}), 200


@app.route("/api/admin/recruiters", methods=["GET"])
@require_auth(role="admin")
def admin_list_recruiters():
    recruiters = storage.list_recruiters()
    return jsonify(
        {
            "recruiters": [
                {
                    "user_id": recruiter["user_id"],
                    "email": recruiter["email"],
                    "is_approved": bool(recruiter.get("is_approved", False)),
                    "created_at": recruiter.get("created_at"),
                    "last_login_at": recruiter.get("last_login_at"),
                }
                for recruiter in recruiters
            ]
        }
    ), 200


@app.route("/api/admin/recruiters/<recruiter_id>/approve", methods=["PUT"])
@require_auth(role="admin")
def admin_approve_recruiter(recruiter_id: str):
    recruiter = storage.approve_recruiter(recruiter_id)
    if not recruiter:
        return jsonify({"error": "Recruiter not found"}), 404
    return jsonify({"message": "Recruiter approved", "recruiter_id": recruiter_id}), 200


@app.route("/api/admin/recruiters/<recruiter_id>", methods=["DELETE"])
@require_auth(role="admin")
def admin_delete_recruiter(recruiter_id: str):
    recruiter = storage.get_user_by_id(recruiter_id)
    if not recruiter or recruiter.get("role") != "recruiter":
        return jsonify({"error": "Recruiter not found"}), 404

    jobs = storage.list_jobs_by_creator(recruiter_id)
    for job in jobs:
        storage.delete_job(job["job_id"])

    storage.delete_user(recruiter_id)
    return jsonify({"message": "Recruiter deleted"}), 200


@app.route("/api/admin/jobs/<job_id>", methods=["DELETE"])
@require_auth(role="admin")
def admin_delete_job(job_id: str):
    deleted = storage.delete_job(job_id)
    if not deleted:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({"message": "Job deleted"}), 200


# ==================== UTILITY ENDPOINTS ====================

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "ResumeIQ API", "version": "2.0.0"}), 200


@app.route("/api/stats", methods=["GET"])
def get_stats():
    stats = storage.get_stats()
    return jsonify(
        {
            "total_candidates": stats["total_candidates"],
            "total_jobs": stats["total_jobs"],
            "total_users": stats.get("total_users", 0),
        }
    ), 200


@app.route("/api/uploads/<path:filename>", methods=["GET"])
def serve_uploaded_resume(filename: str):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename, as_attachment=False)


_ensure_default_admin()


if __name__ == "__main__":
    print("Starting ResumeIQ API Server...")
    print("Server running on http://localhost:5000")
    print("Default admin from env ADMIN_EMAIL / ADMIN_PASSWORD")
    app.run(debug=True, host="0.0.0.0", port=5000)
