import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Basic Config
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'default-dev-secret-key-please-change'
    
    # Database Config
    database_url = os.environ.get('DATABASE_URL')
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_DATABASE_URI = database_url or 'sqlite:///local.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Other potential configs (Mail, etc.)
