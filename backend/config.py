import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent

# Telegram
TOKEN = os.environ.get('TG_BOT_TOKEN') or ''
CHAT_ID = os.environ.get('TG_CHAT_ID') or ''
TG_SECRET_TOKEN = os.environ.get('TG_SECRET_TOKEN') or ''

# Server
HOST = os.environ.get('HOST', '0.0.0.0')
PORT = int(os.environ.get('PORT', 5000))
WEBHOOK_URL = os.environ.get('WEBHOOK_URL', '')

# Database
DATABASE = os.environ.get('DATABASE_URL', '').replace('sqlite:///', str(BASE_DIR) + '/') or str(BASE_DIR / 'leads.db')

# API
API_KEY = os.environ.get('API_KEY', '')
