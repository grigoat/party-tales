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

# Fall back to Railway's auto-provided public domain so the webhook can be
# registered automatically even when WEBHOOK_URL is not set explicitly.
if not WEBHOOK_URL:
    _railway_domain = os.environ.get('RAILWAY_PUBLIC_DOMAIN', '')
    if _railway_domain:
        WEBHOOK_URL = 'https://' + _railway_domain.replace('https://', '').replace('http://', '').rstrip('/')

# Database
DATABASE = os.environ.get('DATABASE_URL', '').replace('sqlite:///', str(BASE_DIR) + '/') or str(BASE_DIR / 'leads.db')

# API
API_KEY = os.environ.get('API_KEY', '')

# AI assistant — answers website chat until a manager joins.
# Works with any OpenAI-compatible provider (default: Groq, free tier).
AI_API_KEY = os.environ.get('AI_API_KEY', '')
AI_BASE_URL = os.environ.get('AI_BASE_URL', 'https://api.groq.com/openai/v1')
AI_MODEL = os.environ.get('AI_MODEL', 'llama-3.3-70b-versatile')
# AI replies are enabled only while no human manager has joined the session.
AI_ENABLED = os.environ.get('AI_ENABLED', '1') not in ('0', 'false', 'False', '')
# Company knowledge base fed to the assistant so it answers like a real employee.
# Plain text / Markdown; edit knowledge.md to teach Natalia more.
AI_KNOWLEDGE_PATH = os.environ.get('AI_KNOWLEDGE_PATH', str(BASE_DIR / 'knowledge.md'))
