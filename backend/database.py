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

        # --- Live chat ---
        conn.execute('''
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                visitor_id TEXT NOT NULL,
                name TEXT DEFAULT '',
                page_url TEXT DEFAULT '',
                language TEXT DEFAULT '',
                status TEXT DEFAULT 'waiting',
                manager_chat_id TEXT DEFAULT '',
                tg_message_id INTEGER,
                created_at TEXT NOT NULL,
                last_activity TEXT NOT NULL
            )
        ''')
        conn.execute('''
            CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor
            ON chat_sessions(visitor_id)
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                sender TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        conn.execute('''
            CREATE INDEX IF NOT EXISTS idx_chat_messages_session
            ON chat_messages(session_id, id)
        ''')
        # Which chat session each manager (telegram chat) is currently replying to
        conn.execute('''
            CREATE TABLE IF NOT EXISTS manager_state (
                chat_id TEXT PRIMARY KEY,
                active_session_id INTEGER
            )
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


# ============================ Live chat ============================

def create_chat_session(visitor_id, name='', page_url='', language=''):
    now = datetime.utcnow().isoformat()
    with get_db() as conn:
        cur = conn.execute(
            'INSERT INTO chat_sessions (visitor_id, name, page_url, language, status, created_at, last_activity) '
            "VALUES (?, ?, ?, ?, 'waiting', ?, ?)",
            (visitor_id, name, page_url, language, now, now)
        )
        return cur.lastrowid


def get_chat_session(session_id):
    with get_db() as conn:
        r = conn.execute('SELECT * FROM chat_sessions WHERE id = ?', (session_id,)).fetchone()
        return dict(r) if r else None


def get_open_chat_sessions(limit=10):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM chat_sessions WHERE status IN ('waiting', 'active') "
            "ORDER BY last_activity DESC LIMIT ?",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


def touch_chat_session(session_id):
    now = datetime.utcnow().isoformat()
    with get_db() as conn:
        conn.execute('UPDATE chat_sessions SET last_activity = ? WHERE id = ?', (now, session_id))


def set_session_manager(session_id, manager_chat_id):
    with get_db() as conn:
        conn.execute(
            "UPDATE chat_sessions SET manager_chat_id = ?, status = 'active' WHERE id = ?",
            (str(manager_chat_id), session_id)
        )


def set_session_status(session_id, status):
    with get_db() as conn:
        conn.execute('UPDATE chat_sessions SET status = ? WHERE id = ?', (status, session_id))


def set_session_tg_message(session_id, tg_message_id):
    with get_db() as conn:
        conn.execute('UPDATE chat_sessions SET tg_message_id = ? WHERE id = ?', (tg_message_id, session_id))


def add_chat_message(session_id, sender, text):
    now = datetime.utcnow().isoformat()
    with get_db() as conn:
        cur = conn.execute(
            'INSERT INTO chat_messages (session_id, sender, text, created_at) VALUES (?, ?, ?, ?)',
            (session_id, sender, text, now)
        )
        conn.execute('UPDATE chat_sessions SET last_activity = ? WHERE id = ?', (now, session_id))
        return cur.lastrowid


def get_chat_messages(session_id, after_id=0, senders=None):
    with get_db() as conn:
        if senders:
            placeholders = ','.join('?' for _ in senders)
            rows = conn.execute(
                f'SELECT * FROM chat_messages WHERE session_id = ? AND id > ? '
                f'AND sender IN ({placeholders}) ORDER BY id ASC',
                (session_id, after_id, *senders)
            ).fetchall()
        else:
            rows = conn.execute(
                'SELECT * FROM chat_messages WHERE session_id = ? AND id > ? ORDER BY id ASC',
                (session_id, after_id)
            ).fetchall()
        return [dict(r) for r in rows]


def set_manager_active(chat_id, session_id):
    with get_db() as conn:
        conn.execute(
            'INSERT INTO manager_state (chat_id, active_session_id) VALUES (?, ?) '
            'ON CONFLICT(chat_id) DO UPDATE SET active_session_id = excluded.active_session_id',
            (str(chat_id), session_id)
        )


def get_manager_active(chat_id):
    with get_db() as conn:
        r = conn.execute(
            'SELECT active_session_id FROM manager_state WHERE chat_id = ?', (str(chat_id),)
        ).fetchone()
        return r['active_session_id'] if r else None


def clear_manager_active(chat_id):
    with get_db() as conn:
        conn.execute(
            'UPDATE manager_state SET active_session_id = NULL WHERE chat_id = ?', (str(chat_id),)
        )
