"""SQLite storage layer for ResumeIQ with auth-aware entities."""

import json
import os
import sqlite3
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional


class Storage:
    """Simple SQLite-backed storage for users, candidates and jobs."""

    def __init__(self, db_path: str):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_column(self, conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
        columns = [row["name"] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()]
        if column not in columns:
            # SQLite cannot add UNIQUE columns via ALTER TABLE.
            # Keep migration safe by stripping UNIQUE from the column definition.
            normalized_definition = definition.replace(" UNIQUE", "").replace("UNIQUE ", "")
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {normalized_definition}")

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'candidate',
                    is_approved INTEGER NOT NULL DEFAULT 0,
                    candidate_id TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    last_login_at TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS candidates (
                    candidate_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    candidate_name TEXT,
                    email TEXT,
                    phone TEXT,
                    linkedin TEXT,
                    github TEXT,
                    leetcode TEXT,
                    codeforces TEXT,
                    codechef TEXT,
                    github_link TEXT,
                    leetcode_link TEXT,
                    codeforces_link TEXT,
                    codechef_link TEXT,
                    skills_json TEXT,
                    education_json TEXT,
                    experience_json TEXT,
                    projects_json TEXT,
                    extracted_links_json TEXT,
                    parsed_contact_json TEXT,
                    profile_insights_json TEXT,
                    profile_status_json TEXT,
                    raw_text TEXT,
                    full_text TEXT,
                    resume_file_path TEXT,
                    resume_file_name TEXT,
                    is_manual_entry INTEGER DEFAULT 0,
                    created_at TEXT,
                    updated_at TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS jobs (
                    job_id TEXT PRIMARY KEY,
                    created_by_user_id TEXT,
                    job_title TEXT,
                    job_description TEXT,
                    required_skills_json TEXT,
                    company_name TEXT,
                    location TEXT,
                    created_at TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS job_applications (
                    job_id TEXT NOT NULL,
                    candidate_id TEXT NOT NULL,
                    applied_at TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    shortlisted INTEGER NOT NULL DEFAULT 0,
                    match_score REAL DEFAULT 0,
                    matched_skills_json TEXT,
                    missing_skills_json TEXT,
                    updated_at TEXT,
                    PRIMARY KEY (job_id, candidate_id)
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS applications (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    job_id TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    match_score REAL DEFAULT 0,
                    created_at TEXT,
                    updated_at TEXT,
                    UNIQUE(user_id, job_id)
                )
                """
            )

            self._ensure_column(conn, "candidates", "user_id", "TEXT")
            self._ensure_column(conn, "jobs", "created_by_user_id", "TEXT")
            self._ensure_column(conn, "users", "is_approved", "INTEGER NOT NULL DEFAULT 0")
            self._ensure_column(conn, "candidates", "github_link", "TEXT")
            self._ensure_column(conn, "candidates", "leetcode_link", "TEXT")
            self._ensure_column(conn, "candidates", "codeforces_link", "TEXT")
            self._ensure_column(conn, "candidates", "codechef_link", "TEXT")
            self._ensure_column(conn, "job_applications", "status", "TEXT NOT NULL DEFAULT 'pending'")
            self._ensure_column(conn, "job_applications", "shortlisted", "INTEGER NOT NULL DEFAULT 0")
            self._ensure_column(conn, "job_applications", "match_score", "REAL DEFAULT 0")
            self._ensure_column(conn, "job_applications", "matched_skills_json", "TEXT")
            self._ensure_column(conn, "job_applications", "missing_skills_json", "TEXT")
            self._ensure_column(conn, "job_applications", "updated_at", "TEXT")
            self._ensure_column(conn, "applications", "status", "TEXT NOT NULL DEFAULT 'pending'")
            self._ensure_column(conn, "applications", "match_score", "REAL DEFAULT 0")
            self._ensure_column(conn, "applications", "created_at", "TEXT")
            self._ensure_column(conn, "applications", "updated_at", "TEXT")

            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_creator ON jobs(created_by_user_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id)")
            conn.commit()

    @staticmethod
    def _json_dumps(value: Any) -> str:
        return json.dumps(value or [], ensure_ascii=False)

    @staticmethod
    def _json_loads(value: Optional[str], default: Any) -> Any:
        if not value:
            return default
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return default

    def create_user(self, user: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO users (user_id, email, password_hash, role, candidate_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["user_id"],
                    user["email"].strip().lower(),
                    user["password_hash"],
                    user.get("role", "candidate"),
                    user.get("candidate_id"),
                    now,
                    now,
                ),
            )
            if "is_approved" in user:
                conn.execute(
                    "UPDATE users SET is_approved = ? WHERE user_id = ?",
                    (1 if user.get("is_approved") else 0, user["user_id"]),
                )
            conn.commit()
        return self.get_user_by_id(user["user_id"])

    def update_user(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not updates:
            return self.get_user_by_id(user_id)
        allowed = {
            "email": "email",
            "password_hash": "password_hash",
            "role": "role",
            "is_approved": "is_approved",
            "candidate_id": "candidate_id",
            "last_login_at": "last_login_at",
        }
        assignments = []
        values: List[Any] = []
        for key, value in updates.items():
            if key in allowed:
                assignments.append(f"{allowed[key]} = ?")
                if key == "email" and isinstance(value, str):
                    values.append(value.strip().lower())
                else:
                    values.append(value)
        assignments.append("updated_at = ?")
        values.append(datetime.utcnow().isoformat())
        values.append(user_id)

        if not values:
            return self.get_user_by_id(user_id)

        with self._connect() as conn:
            conn.execute(f"UPDATE users SET {', '.join(assignments)} WHERE user_id = ?", tuple(values))
            conn.commit()
        return self.get_user_by_id(user_id)

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
        if not row:
            return None
        return self._row_to_user(row)

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
        if not row:
            return None
        return self._row_to_user(row)

    @staticmethod
    def _row_to_user(row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "user_id": row["user_id"],
            "email": row["email"],
            "password_hash": row["password_hash"],
            "role": row["role"] or "candidate",
            "is_approved": bool(row["is_approved"]),
            "candidate_id": row["candidate_id"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "last_login_at": row["last_login_at"],
        }

    def list_recruiters(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM users WHERE role = 'recruiter' ORDER BY datetime(created_at) DESC"
            ).fetchall()
        return [self._row_to_user(row) for row in rows]

    def approve_recruiter(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            conn.execute(
                "UPDATE users SET is_approved = 1, updated_at = ? WHERE user_id = ? AND role = 'recruiter'",
                (datetime.utcnow().isoformat(), user_id),
            )
            conn.commit()
        user = self.get_user_by_id(user_id)
        if not user or user.get("role") != "recruiter":
            return None
        return user

    def upsert_candidate(self, candidate: Dict[str, Any], user_id: Optional[str] = None) -> str:
        now = datetime.utcnow().isoformat()
        candidate_id = candidate["candidate_id"]
        incoming_user_id = user_id or candidate.get("user_id")

        # Enforce one candidate row per user at application level.
        # If a candidate already exists for this user_id, update that row.
        existing_by_user = self.get_candidate_by_user(incoming_user_id) if incoming_user_id else None
        if existing_by_user:
            candidate_id = existing_by_user["candidate_id"]

        existing = self.get_candidate(candidate_id)

        merged = {**(existing or {}), **candidate}
        merged["candidate_id"] = candidate_id
        merged["updated_at"] = now
        merged["created_at"] = (existing or {}).get("created_at", now)
        merged_user_id = incoming_user_id or merged.get("user_id") or (existing or {}).get("user_id")
        merged["user_id"] = merged_user_id

        contact = merged.get("contact", {}) or {}
        coding_profiles = merged.get("coding_profiles", {}) or {}

        with self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO candidates (
                    candidate_id, user_id, candidate_name, email, phone, linkedin, github,
                    leetcode, codeforces, codechef,
                    github_link, leetcode_link, codeforces_link, codechef_link,
                    skills_json, education_json, experience_json, projects_json,
                    extracted_links_json, parsed_contact_json,
                    profile_insights_json, profile_status_json,
                    raw_text, full_text, resume_file_path, resume_file_name,
                    is_manual_entry, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    candidate_id,
                    merged_user_id,
                    merged.get("candidate_name", ""),
                    contact.get("email", ""),
                    contact.get("phone", ""),
                    contact.get("linkedin", ""),
                    contact.get("github", ""),
                    coding_profiles.get("leetcode", ""),
                    coding_profiles.get("codeforces", ""),
                    coding_profiles.get("codechef", ""),
                    coding_profiles.get("github", contact.get("github", "")),
                    coding_profiles.get("leetcode", ""),
                    coding_profiles.get("codeforces", ""),
                    coding_profiles.get("codechef", ""),
                    self._json_dumps(merged.get("skills", [])),
                    self._json_dumps(merged.get("education", [])),
                    self._json_dumps(merged.get("experience", [])),
                    self._json_dumps(merged.get("projects", [])),
                    self._json_dumps(merged.get("links", [])),
                    self._json_dumps(contact),
                    self._json_dumps(merged.get("profile_insights", {})),
                    self._json_dumps(merged.get("profile_status", {})),
                    merged.get("raw_text", ""),
                    merged.get("full_text", ""),
                    merged.get("file_path", ""),
                    merged.get("file_name", ""),
                    1 if merged.get("is_manual_entry", False) else 0,
                    merged["created_at"],
                    merged["updated_at"],
                ),
            )
            if merged_user_id:
                conn.execute(
                    "UPDATE users SET candidate_id = ?, updated_at = ? WHERE user_id = ?",
                    (candidate_id, now, merged_user_id),
                )
            conn.commit()

        return candidate_id

    def get_candidate(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM candidates WHERE candidate_id = ?", (candidate_id,)
            ).fetchone()
        if not row:
            return None
        return self._row_to_candidate(row)

    def get_candidate_by_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM candidates WHERE user_id = ?", (user_id,)).fetchone()
        if not row:
            return None
        return self._row_to_candidate(row)

    def list_candidates(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM candidates ORDER BY datetime(updated_at) DESC"
            ).fetchall()
        return [self._row_to_candidate(row) for row in rows]

    def delete_candidate(self, candidate_id: str, delete_user_link: bool = True) -> Optional[Dict[str, Any]]:
        candidate = self.get_candidate(candidate_id)
        if not candidate:
            return None
        with self._connect() as conn:
            conn.execute("DELETE FROM job_applications WHERE candidate_id = ?", (candidate_id,))
            conn.execute("DELETE FROM candidates WHERE candidate_id = ?", (candidate_id,))
            if candidate.get("user_id"):
                conn.execute("DELETE FROM applications WHERE user_id = ?", (candidate.get("user_id"),))
            if delete_user_link and candidate.get("user_id"):
                conn.execute(
                    "UPDATE users SET candidate_id = NULL, updated_at = ? WHERE user_id = ?",
                    (datetime.utcnow().isoformat(), candidate.get("user_id")),
                )
            conn.commit()
        return candidate

    def delete_user(self, user_id: str) -> bool:
        with self._connect() as conn:
            conn.execute("DELETE FROM applications WHERE user_id = ?", (user_id,))
            deleted = conn.execute("DELETE FROM users WHERE user_id = ?", (user_id,)).rowcount
            conn.commit()
        return deleted > 0

    def _row_to_candidate(self, row: sqlite3.Row) -> Dict[str, Any]:
        contact = {
            "email": row["email"] or "",
            "phone": row["phone"] or "",
            "linkedin": row["linkedin"] or "",
            "github": row["github"] or "",
        }
        coding_profiles = {
            "github": row["github_link"] or row["github"] or "",
            "leetcode": row["leetcode_link"] or row["leetcode"] or "",
            "codeforces": row["codeforces_link"] or row["codeforces"] or "",
            "codechef": row["codechef_link"] or row["codechef"] or "",
        }
        return {
            "candidate_id": row["candidate_id"],
            "user_id": row["user_id"],
            "candidate_name": row["candidate_name"] or "",
            "contact": contact,
            "coding_profiles": coding_profiles,
            "skills": self._json_loads(row["skills_json"], []),
            "education": self._json_loads(row["education_json"], []),
            "experience": self._json_loads(row["experience_json"], []),
            "projects": self._json_loads(row["projects_json"], []),
            "links": self._json_loads(row["extracted_links_json"], []),
            "profile_insights": self._json_loads(row["profile_insights_json"], {}),
            "profile_status": self._json_loads(row["profile_status_json"], {}),
            "raw_text": row["raw_text"] or "",
            "full_text": row["full_text"] or "",
            "file_path": row["resume_file_path"] or "",
            "file_name": row["resume_file_name"] or "",
            "is_manual_entry": bool(row["is_manual_entry"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }

    def list_jobs_by_creator(self, created_by_user_id: str) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM jobs WHERE created_by_user_id = ? ORDER BY datetime(created_at) DESC",
                (created_by_user_id,),
            ).fetchall()
        return [self._row_to_job(row) for row in rows]

    def set_job_candidates(self, job_id: str, candidate_ids: List[str]) -> None:
        now = datetime.utcnow().isoformat()
        with self._connect() as conn:
            existing_rows = conn.execute(
                "SELECT candidate_id, status, shortlisted, match_score, matched_skills_json, missing_skills_json FROM job_applications WHERE job_id = ?",
                (job_id,),
            ).fetchall()
            existing_map = {row["candidate_id"]: row for row in existing_rows}
            conn.execute("DELETE FROM job_applications WHERE job_id = ?", (job_id,))
            for candidate_id in candidate_ids:
                existing = existing_map.get(candidate_id)
                conn.execute(
                    """
                    INSERT OR REPLACE INTO job_applications
                    (job_id, candidate_id, applied_at, status, shortlisted, match_score, matched_skills_json, missing_skills_json, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        job_id,
                        candidate_id,
                        now,
                        (existing["status"] if existing else "pending") or "pending",
                        int(existing["shortlisted"]) if existing else 0,
                        float(existing["match_score"]) if existing and existing["match_score"] is not None else 0,
                        existing["matched_skills_json"] if existing else self._json_dumps([]),
                        existing["missing_skills_json"] if existing else self._json_dumps([]),
                        now,
                    ),
                )
            conn.commit()

    def get_job_candidates(self, job_id: str) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT c.*
                FROM candidates c
                INNER JOIN job_applications ja ON ja.candidate_id = c.candidate_id
                WHERE ja.job_id = ?
                ORDER BY datetime(c.updated_at) DESC
                """,
                (job_id,),
            ).fetchall()
        return [self._row_to_candidate(row) for row in rows]

    def get_job_candidate_records(self, job_id: str) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT c.*, ja.status, ja.shortlisted, ja.match_score, ja.matched_skills_json, ja.missing_skills_json
                FROM candidates c
                INNER JOIN job_applications ja ON ja.candidate_id = c.candidate_id
                WHERE ja.job_id = ?
                ORDER BY ja.match_score DESC, datetime(c.updated_at) DESC
                """,
                (job_id,),
            ).fetchall()

        records: List[Dict[str, Any]] = []
        for row in rows:
            candidate = self._row_to_candidate(row)
            candidate["status"] = (row["status"] or "pending").lower()
            candidate["shortlisted"] = bool(row["shortlisted"])
            candidate["match_score"] = round(float(row["match_score"] or 0), 2)
            candidate["matched_skills"] = self._json_loads(row["matched_skills_json"], [])
            candidate["missing_skills"] = self._json_loads(row["missing_skills_json"], [])
            records.append(candidate)
        return records

    def update_job_candidate_status(self, job_id: str, candidate_id: str, status: str) -> bool:
        normalized = (status or "").strip().lower()
        if normalized not in {"pending", "selected", "rejected"}:
            return False
        with self._connect() as conn:
            updated = conn.execute(
                "UPDATE job_applications SET status = ?, updated_at = ? WHERE job_id = ? AND candidate_id = ?",
                (normalized, datetime.utcnow().isoformat(), job_id, candidate_id),
            ).rowcount
            conn.commit()
        return updated > 0

    def update_job_candidate_shortlist(self, job_id: str, candidate_id: str, shortlisted: bool) -> bool:
        with self._connect() as conn:
            updated = conn.execute(
                "UPDATE job_applications SET shortlisted = ?, updated_at = ? WHERE job_id = ? AND candidate_id = ?",
                (1 if shortlisted else 0, datetime.utcnow().isoformat(), job_id, candidate_id),
            ).rowcount
            conn.commit()
        return updated > 0

    def save_job_candidate_match(self, job_id: str, candidate_id: str, match_score: float, matched_skills: List[str], missing_skills: List[str]) -> None:
        now = datetime.utcnow().isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE job_applications
                SET match_score = ?, matched_skills_json = ?, missing_skills_json = ?, updated_at = ?
                WHERE job_id = ? AND candidate_id = ?
                """,
                (
                    float(match_score or 0),
                    self._json_dumps(matched_skills or []),
                    self._json_dumps(missing_skills or []),
                    now,
                    job_id,
                    candidate_id,
                ),
            )
            candidate_row = conn.execute(
                "SELECT user_id FROM candidates WHERE candidate_id = ?",
                (candidate_id,),
            ).fetchone()
            if candidate_row and candidate_row["user_id"]:
                conn.execute(
                    "UPDATE applications SET match_score = ?, updated_at = ? WHERE user_id = ? AND job_id = ?",
                    (float(match_score or 0), now, candidate_row["user_id"], job_id),
                )
            conn.commit()

    def create_application(self, user_id: str, job_id: str, status: str = "pending", match_score: float = 0) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat()
        application_id = str(uuid.uuid4())
        normalized_status = (status or "pending").strip().lower()
        if normalized_status not in {"pending", "selected", "rejected"}:
            normalized_status = "pending"

        with self._connect() as conn:
            existing = conn.execute(
                "SELECT * FROM applications WHERE user_id = ? AND job_id = ?",
                (user_id, job_id),
            ).fetchone()
            if existing:
                conn.execute(
                    "UPDATE applications SET match_score = ?, updated_at = ? WHERE user_id = ? AND job_id = ?",
                    (float(match_score or existing["match_score"] or 0), now, user_id, job_id),
                )
            else:
                conn.execute(
                    """
                    INSERT INTO applications (id, user_id, job_id, status, match_score, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (application_id, user_id, job_id, normalized_status, float(match_score or 0), now, now),
                )
            conn.commit()

        return self.get_application(user_id, job_id) or {
            "id": application_id,
            "user_id": user_id,
            "job_id": job_id,
            "status": normalized_status,
            "match_score": float(match_score or 0),
            "created_at": now,
            "updated_at": now,
        }

    def get_application(self, user_id: str, job_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM applications WHERE user_id = ? AND job_id = ?",
                (user_id, job_id),
            ).fetchone()
        if not row:
            return None
        return self._row_to_application(row)

    def list_available_jobs_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT j.*, a.status AS application_status, a.match_score AS application_match_score
                FROM jobs j
                LEFT JOIN applications a ON a.job_id = j.job_id AND a.user_id = ?
                ORDER BY datetime(j.created_at) DESC
                """,
                (user_id,),
            ).fetchall()

        jobs: List[Dict[str, Any]] = []
        for row in rows:
            job = self._row_to_job(row)
            job["is_applied"] = row["application_status"] is not None
            if row["application_status"] is not None:
                job["application_status"] = row["application_status"]
                job["application_match_score"] = round(float(row["application_match_score"] or 0), 2)
            jobs.append(job)
        return jobs

    def list_applied_jobs_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT j.*, a.id AS application_id, a.status AS application_status, a.match_score AS application_match_score,
                       a.created_at AS application_created_at, a.updated_at AS application_updated_at
                FROM applications a
                INNER JOIN jobs j ON j.job_id = a.job_id
                WHERE a.user_id = ?
                ORDER BY datetime(a.created_at) DESC
                """,
                (user_id,),
            ).fetchall()

        result: List[Dict[str, Any]] = []
        for row in rows:
            result.append(
                {
                    "application_id": row["application_id"],
                    "status": (row["application_status"] or "pending").lower(),
                    "match_score": round(float(row["application_match_score"] or 0), 2),
                    "applied_at": row["application_created_at"],
                    "updated_at": row["application_updated_at"],
                    "job": self._row_to_job(row),
                }
            )
        return result

    def update_application_status_for_candidate(self, job_id: str, candidate_id: str, status: str) -> None:
        normalized = (status or "pending").strip().lower()
        if normalized not in {"pending", "selected", "rejected"}:
            return

        with self._connect() as conn:
            candidate_row = conn.execute(
                "SELECT user_id FROM candidates WHERE candidate_id = ?",
                (candidate_id,),
            ).fetchone()
            if not candidate_row or not candidate_row["user_id"]:
                return
            conn.execute(
                "UPDATE applications SET status = ?, updated_at = ? WHERE user_id = ? AND job_id = ?",
                (normalized, datetime.utcnow().isoformat(), candidate_row["user_id"], job_id),
            )
            conn.commit()

    @staticmethod
    def _row_to_application(row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "user_id": row["user_id"],
            "job_id": row["job_id"],
            "status": (row["status"] or "pending").lower(),
            "match_score": round(float(row["match_score"] or 0), 2),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }

    def create_job(self, job: Dict[str, Any]) -> str:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO jobs (
                    job_id, created_by_user_id, job_title, job_description, required_skills_json,
                    company_name, location, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    job["job_id"],
                    job.get("created_by_user_id"),
                    job.get("job_title", ""),
                    job.get("job_description", ""),
                    self._json_dumps(job.get("required_skills", [])),
                    job.get("company_name", ""),
                    job.get("location", ""),
                    job.get("created_at", datetime.utcnow().isoformat()),
                ),
            )
            conn.commit()
        return job["job_id"]

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        if not row:
            return None
        return self._row_to_job(row)

    def list_jobs(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM jobs ORDER BY datetime(created_at) DESC").fetchall()
        return [self._row_to_job(row) for row in rows]

    def list_recent_jobs(self, limit: int = 8) -> List[Dict[str, Any]]:
        safe_limit = max(1, min(int(limit), 20))
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT
                    j.*,
                    COUNT(a.id) AS applicants_count
                FROM jobs j
                LEFT JOIN applications a ON a.job_id = j.job_id
                GROUP BY j.job_id
                ORDER BY datetime(j.created_at) DESC
                LIMIT ?
                """,
                (safe_limit,),
            ).fetchall()

        jobs: List[Dict[str, Any]] = []
        for row in rows:
            job = self._row_to_job(row)
            job["applicants"] = int(row["applicants_count"] or 0)
            jobs.append(job)
        return jobs

    def count_job_applicants(self, job_id: str) -> int:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(*) AS count FROM applications WHERE job_id = ?",
                (job_id,),
            ).fetchone()
        return int((row["count"] if row else 0) or 0)

    def delete_job(self, job_id: str) -> bool:
        with self._connect() as conn:
            conn.execute("DELETE FROM job_applications WHERE job_id = ?", (job_id,))
            conn.execute("DELETE FROM applications WHERE job_id = ?", (job_id,))
            deleted = conn.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,)).rowcount
            conn.commit()
        return deleted > 0

    def _row_to_job(self, row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "job_id": row["job_id"],
            "created_by_user_id": row["created_by_user_id"],
            "job_title": row["job_title"] or "",
            "job_description": row["job_description"] or "",
            "required_skills": self._json_loads(row["required_skills_json"], []),
            "company_name": row["company_name"] or "",
            "location": row["location"] or "",
            "created_at": row["created_at"],
        }

    def get_stats(self) -> Dict[str, Any]:
        with self._connect() as conn:
            c_count = conn.execute("SELECT COUNT(*) AS count FROM candidates").fetchone()["count"]
            j_count = conn.execute("SELECT COUNT(*) AS count FROM jobs").fetchone()["count"]
            u_count = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        return {
            "total_candidates": c_count,
            "total_jobs": j_count,
            "total_users": u_count,
        }
