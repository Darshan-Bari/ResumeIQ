"""Resume parser with practical heuristic extraction for hackathon use."""

import re
from typing import Any, Dict, List

import PyPDF2
import pdfplumber

try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None


class ResumeParser:
    """Parse resume PDFs and extract structured information"""
    
    def __init__(self):
        pass
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text from PDF using multiple methods
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Extracted text from the PDF
        """
        text = ""
        
        # Try pdfplumber first (more reliable)
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            if text.strip():
                return text
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")
        
        # Fallback to PyPDF2
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() or ""
            if text.strip():
                return text
        except Exception as e:
            print(f"PyPDF2 extraction failed: {e}")

        # Final fallback to PyMuPDF when available
        if fitz is not None:
            try:
                doc = fitz.open(pdf_path)
                for page in doc:
                    text += page.get_text() or ""
                doc.close()
            except Exception as e:
                print(f"PyMuPDF extraction failed: {e}")
        
        return text

    def extract_name(self, text: str, fallback_name: str = "") -> str:
        """Extract likely candidate name from first non-empty lines."""
        lines = [line.strip() for line in text.splitlines() if line.strip()]
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
        """
        Extract education information
        
        Args:
            text: Resume text
            
        Returns:
            List of education entries
        """
        education = []
        
        # Common degree patterns
        degree_patterns = {
            'B.Tech': r"(?:B\.Tech|B\.E\.|Bachelor of Technology|Bachelor of Engineering)",
            'B.Sc': r"(?:B\.Sc|Bachelor of Science)",
            'B.A': r"(?:B\.A|Bachelor of Arts)",
            'M.Tech': r"(?:M\.Tech|Master of Technology)",
            'M.S': r"(?:M\.S|Master of Science)",
            'MBA': r"(?:MBA|Master of Business Administration)",
            'M.Sc': r"(?:M\.Sc|Master of Science)",
            'PhD': r"(?:PhD|Ph\.D|Doctor of Philosophy)",
            'BE': r"(?:BE|B\.E(?!\.))",
            '12th': r"(?:12th|XII|Higher Secondary)",
            '10th': r"(?:10th|X|Secondary School)",
        }
        
        text_lines = text.split("\n")
        for i, line in enumerate(text_lines):
            _ = i
            for degree_name, pattern in degree_patterns.items():
                if re.search(pattern, line, re.IGNORECASE):
                    education.append({
                        'degree': degree_name,
                        'raw_line': line.strip()
                    })
        
        return education
    
    def extract_experience(self, text: str) -> List[Dict[str, str]]:
        """
        Extract work experience information
        
        Args:
            text: Resume text
            
        Returns:
            List of experience entries
        """
        experience = []
        
        # Common experience patterns
        experience_keywords = [
            'experience', 'worked', 'role', 'position', 'responsible',
            'developed', 'designed', 'implemented', 'led', 'managed'
        ]
        
        text_lines = text.split('\n')
        
        # Look for company names, job titles, and descriptions
        for i, line in enumerate(text_lines):
            # Check for lines that might contain job titles or companies
            if any(keyword in line.lower() for keyword in experience_keywords):
                if line.strip():
                    experience.append({'role': line.strip()})
        
        return experience[:5]  # Return top 5 experiences

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
        # Extract text
        text = self.extract_text_from_pdf(pdf_path)
        
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
        skills = list(set([s.lower().strip() for s in skills]))
        
        return {
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
