import sqlite3
from datetime import datetime
from config import DATABASE


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA busy_timeout=5000')
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                country TEXT DEFAULT '',
                event_type TEXT DEFAULT '',
                comment TEXT DEFAULT '',
                page_url TEXT DEFAULT '',
                language TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                status TEXT DEFAULT 'new'
            )
        ''')
        conn.execute('''
            CREATE INDEX IF NOT EXISTS idx_leads_status
            ON leads(status)
        ''')
        conn.execute('''
            CREATE INDEX IF NOT EXISTS idx_leads_created_at
            ON leads(created_at DESC)
        ''')


def add_lead(name, phone, country, event_type, comment, page_url='', language=''):
    created_at = datetime.utcnow().isoformat()
    with get_db() as conn:
        cur = conn.execute(
            'INSERT INTO leads (name, phone, country, event_type, comment, page_url, language, created_at) '
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (name, phone, country, event_type, comment, page_url, language, created_at)
        )
        return cur.lastrowid


def get_approved_reviews(limit=20):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, name, country, comment, created_at FROM leads "
            "WHERE event_type = 'Review' AND status = 'approved' "
            "ORDER BY created_at DESC LIMIT ?",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


def get_leads(limit=10, offset=0, status=None):
    with get_db() as conn:
        if status:
            rows = conn.execute(
                'SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
                (status, limit, offset)
            ).fetchall()
        else:
            rows = conn.execute(
                'SELECT * FROM leads ORDER BY created_at DESC LIMIT ? OFFSET ?',
                (limit, offset)
            ).fetchall()
        return [dict(r) for r in rows]


def get_lead(lead_id):
    with get_db() as conn:
        r = conn.execute('SELECT * FROM leads WHERE id = ?', (lead_id,)).fetchone()
        return dict(r) if r else None


def update_lead_status(lead_id, status):
    with get_db() as conn:
        conn.execute('UPDATE leads SET status = ? WHERE id = ?', (status, lead_id))


def get_stats():
    with get_db() as conn:
        row = conn.execute('''
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) as new,
                SUM(CASE WHEN status='contacted' THEN 1 ELSE 0 END) as contacted,
                SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN status='moderation' THEN 1 ELSE 0 END) as moderation,
                SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected
            FROM leads
        ''').fetchone()
        return dict(row)
