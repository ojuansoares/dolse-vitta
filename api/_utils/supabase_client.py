"""Supabase client for backend"""
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env from project root
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


def get_supabase_client() -> Client:
    """Returns Supabase client with anon key (for public operations)"""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY are required")
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def get_supabase_admin_client() -> Client:
    """Returns Supabase client with service role key (for admin operations)"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
