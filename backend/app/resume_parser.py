"""Resume parser with practical heuristic extraction for hackathon use."""

import os
import re
from typing import Any, Dict, List

import pymupdf4llm


class ResumeParser:
    """Parse resume PDFs and extract structured information"""
    
    def __init__(self):
        pass
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract structured markdown text from a PDF using PyMuPDF4LLM."""
        if not pdf_path or not os.path.isfile(pdf_path):
            raise ValueError("PDF file not found")
        if not pdf_path.lower().endswith(".pdf"):
            raise ValueError("Only PDF files are supported")
        if os.path.getsize(pdf_path) == 0:
            raise ValueError("Uploaded PDF is empty")

        try:
            markdown_text = pymupdf4llm.to_markdown(pdf_path)
        except Exception as exc:
            raise ValueError(f"Unable to parse PDF with PyMuPDF4LLM: {exc}") from exc

        text = re.sub(r"\n{3,}", "\n\n", markdown_text or "").strip()
        if not text:
            raise ValueError("No readable content found in PDF")
        return text

    @staticmethod
    def _section_text(text: str, keys: List[str]) -> str:
        """Extract content under markdown-like section headings."""
        lines = text.splitlines()
        result: List[str] = []
        active = False

        for raw_line in lines:
            line = raw_line.strip()
            if not line:
                if active:
                    result.append("")
                continue

            normalized = line.lower().lstrip("#").strip(" :-")
            if line.startswith("#"):
                if any(key in normalized for key in keys):
                    active = True
                    continue
                if active:
                    break

            if active:
                result.append(line)

        return "\n".join(result).strip()

    def extract_name(self, text: str, fallback_name: str = "") -> str:
        """Extract likely candidate name from first non-empty lines."""
        lines = [line.strip().lstrip("#").strip() for line in text.splitlines() if line.strip()]
        for line in lines[:6]:
            if "@" in line or any(char.isdigit() for char in line):
                continue
            if len(line.split()) in (2, 3) and len(line) < 40:
                return line
        return fallback_name
    
    def extract_skills(self, text: str) -> List[str]:
        """
        Extract technical and soft skills from resume text
        
        Args:
            text: Resume text
            
        Returns:
            List of extracted skills
        """
        # Comprehensive skill set
        technical_skills = {
            # Programming Languages
            'python', 'java', 'javascript', 'c++', 'c#', 'typescript', 'ruby', 'php',
            'swift', 'kotlin', 'rust', 'golang', 'go', 'scala', 'perl', 'r', 'matlab',
            'sql', 'nosql', 'plsql', 'html', 'css', 'xml', 'json',
            
            # Web Frameworks
            'react', 'angular', 'vue', 'nodejs', 'node.js', 'express', 'django', 'flask',
            'spring', 'asp.net', 'laravel', 'fastapi', 'nextjs', 'next.js',
            
            # Databases
            'mysql', 'postgresql', 'mongodb', 'dynamodb', 'cassandra', 'redis',
            'elasticsearch', 'oracle', 'sqlserver', 'firebase', 'cosmos',
            
            # Cloud & DevOps
            'aws', 'aws s3', 'aws ec2', 'aws lambda', 'azure', 'gcp', 'google cloud',
            'docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab ci', 'github actions',
            'terraform', 'ansible', 'cloudformation', 'heroku',
            
            # Data & ML
            'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'pandas', 'numpy',
            'matplotlib', 'seaborn', 'spark', 'hadoop', 'hive', 'big data',
            'machine learning', 'deep learning', 'nlp', 'computer vision',
            
            # Tools & Technologies
            'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack',
            'vim', 'vscode', 'intellij', 'postman', 'selenium', 'junit',
            'rest api', 'graphql', 'microservices', 'apache', 'nginx',
            
            # Soft Skills
            'leadership', 'communication', 'teamwork', 'problem solving',
            'analysis', 'project management', 'agile', 'scrum', 'kanban',
        }
        
        text_lower = text.lower()
        found_skills = set()
        
        for skill in technical_skills:
            # Use word boundary matching
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.add(skill)
        
        return sorted(list(found_skills))
    
    def extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education entries with degree, college and year when possible."""
        education: List[Dict[str, str]] = []
        source = self._section_text(text, ["education", "academic"]) or text
        lines = [line.strip("- *") for line in source.splitlines() if line.strip()]

        degree_regex = re.compile(
            r"(b\.?(tech|e|sc|a|com)|m\.?(tech|e|sc|a)|mba|ph\.?d|bachelor|master|diploma)",
            re.IGNORECASE,
        )
        year_regex = re.compile(r"(?:19|20)\d{2}")

        for line in lines:
            if len(line) < 4:
                continue
            if not degree_regex.search(line):
                continue

            years = year_regex.findall(line)
            year_match = re.search(r"((?:19|20)\d{2}(?:\s*[-–]\s*(?:19|20)\d{2}|\s*[-–]\s*present)?)", line, re.IGNORECASE)

            college_match = re.search(
                r"([A-Z][A-Za-z&.,\-\s]*(?:University|College|Institute|School))",
                line,
            )

            degree_match = degree_regex.search(line)
            education.append(
                {
                    "degree": degree_match.group(0) if degree_match else "",
                    "college": college_match.group(1).strip() if college_match else "",
                    "year": year_match.group(1).strip() if year_match else (years[0] if years else ""),
                    "raw_line": line,
                }
            )

        return education[:8]
    
    def extract_experience(self, text: str) -> List[Dict[str, str]]:
        """Extract work entries with role, company and duration heuristically."""
        entries: List[Dict[str, str]] = []
        source = self._section_text(text, ["experience", "work experience", "employment"]) or text
        lines = [line.strip("- *") for line in source.splitlines() if line.strip()]

        duration_regex = re.compile(
            r"((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*(?:19|20)\d{2}\s*[-–]\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*(?:19|20)\d{2}))",
            re.IGNORECASE,
        )

        for line in lines:
            duration_match = duration_regex.search(line)
            role = ""
            company = ""

            if " at " in line.lower():
                parts = re.split(r"\s+at\s+", line, flags=re.IGNORECASE)
                role = parts[0].strip(" -|")
                company = parts[1].strip(" -|") if len(parts) > 1 else ""
            elif "|" in line:
                parts = [part.strip() for part in line.split("|") if part.strip()]
                if parts:
                    role = parts[0]
                if len(parts) > 1:
                    company = parts[1]
            else:
                role = line

            if duration_match:
                company = company.replace(duration_match.group(1), "").strip(" -,")

            if role or company or duration_match:
                entries.append(
                    {
                        "role": role,
                        "company": company,
                        "duration": duration_match.group(1).strip() if duration_match else "",
                        "raw_line": line,
                    }
                )

        return entries[:8]

    def extract_projects(self, text: str) -> List[Dict[str, str]]:
        """Extract project bullet points from project section heuristically."""
        projects: List[Dict[str, str]] = []
        lines = [line.strip() for line in text.splitlines()]
        in_project_section = False
        for line in lines:
            if not line:
                continue
            lowered = line.lower()
            if any(key in lowered for key in ["project", "projects", "personal project"]):
                in_project_section = True
                continue
            if in_project_section and any(
                lowered.startswith(h)
                for h in ["education", "experience", "skills", "certification", "achievements"]
            ):
                in_project_section = False
            if in_project_section:
                if len(line) > 4 and not re.fullmatch(r"[-_*]+", line):
                    projects.append({"title_or_summary": line})
        return projects[:8]

    def extract_links(self, text: str) -> List[str]:
        """Extract URLs from resume text."""
        raw = re.findall(r"(?:https?://|www\.)[^\s,;()<>]+", text, re.IGNORECASE)
        cleaned = []
        for url in raw:
            normalized = url.strip(".\n\r\t ")
            if normalized and normalized not in cleaned:
                cleaned.append(normalized)
        return cleaned[:20]

    def estimate_experience_years(self, text: str, experience: List[Dict[str, str]]) -> float:
        """Estimate years of experience from text patterns."""
        patterns = re.findall(r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)", text.lower())
        values = [float(value) for value in patterns]
        if values:
            return max(values)
        if len(experience) >= 3:
            return 2.0
        if len(experience) >= 1:
            return 1.0
        return 0.0
    
    def extract_contact_info(self, text: str) -> Dict[str, str]:
        """
        Extract contact information (email, phone, linkedin, github)
        
        Args:
            text: Resume text
            
        Returns:
            Dictionary with contact information
        """
        contact = {
            'email': '',
            'phone': '',
            'linkedin': '',
            'github': '',
            'portfolio': ''
        }
        
        # Email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact['email'] = emails[0]
        
        # Phone pattern (supports +country code and 10-12 digit formats)
        phone_pattern = r'(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,6}'
        phones = re.findall(phone_pattern, text)
        if phones:
            contact['phone'] = phones[0].strip()
        
        # LinkedIn
        linkedin_pattern = r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+'
        linkedin = re.findall(linkedin_pattern, text, re.IGNORECASE)
        if linkedin:
            contact['linkedin'] = linkedin[0]
        
        # GitHub
        github_pattern = r'(?:https?://)?(?:www\.)?github\.com/[\w-]+'
        github = re.findall(github_pattern, text, re.IGNORECASE)
        if github:
            contact['github'] = github[0]
        
        # Portfolio
        portfolio_pattern = r'(?:https?://)?(?:www\.)?[\w-]+\.(?:com|io|dev|me)\b'
        portfolio = re.findall(portfolio_pattern, text)
        if portfolio:
            contact['portfolio'] = portfolio[0]
        
        return contact
    
    def parse_resume(self, pdf_path: str, candidate_name: str = "") -> Dict[str, Any]:
        """
        Complete resume parsing
        
        Args:
            pdf_path: Path to resume PDF
            candidate_name: Optional candidate name
            
        Returns:
            Structured resume data
        """
        try:
            text = self.extract_text_from_pdf(pdf_path)
        except ValueError as exc:
            return {
                "error": str(exc),
                "skills": [],
                "education": [],
                "experience": [],
                "contact": {},
            }
        except Exception:
            return {
                "error": "Unexpected resume parsing error",
                "skills": [],
                "education": [],
                "experience": [],
                "contact": {},
            }
        
        if not text.strip():
            return {
                'error': 'Could not extract text from PDF',
                'skills': [],
                'education': [],
                'experience': [],
                'contact': {}
            }
        
        # Parse components
        inferred_name = self.extract_name(text, candidate_name)
        skills = self.extract_skills(text)
        education = self.extract_education(text)
        experience = self.extract_experience(text)
        projects = self.extract_projects(text)
        contact = self.extract_contact_info(text)
        links = self.extract_links(text)
        estimated_experience_years = self.estimate_experience_years(text, experience)
        
        # Clean skill text (lowercase and remove duplicates)
        skills = sorted(list(set([s.lower().strip() for s in skills if s and s.strip()])))
        
        return {
            'name': inferred_name,
            'email': contact.get('email', ''),
            'phone': contact.get('phone', ''),
            'candidate_name': inferred_name,
            'skills': skills,
            'education': education,
            'experience': experience,
            'projects': projects,
            'links': links,
            'estimated_experience_years': estimated_experience_years,
            'contact': contact,
            'raw_text': text[:2000],  # First 2000 chars for reference
            'full_text': text
        }
