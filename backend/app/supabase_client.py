from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables from .env

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_resume_to_supabase(file_path, file_name):
    try:
        with open(file_path, "rb") as f:
            res = supabase.storage.from_("resumes").upload(
                file_name,
                f,
                {"content-type": "application/pdf"}
            )

        public_url = supabase.storage.from_("resumes").get_public_url(file_name)

        return public_url

    except Exception as e:
        print("Supabase upload error:", e)
        return None