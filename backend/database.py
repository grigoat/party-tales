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

        # --- Migrations: add columns that older databases may not have ---
        _ensure_column(conn, 'leads', 'reply', "TEXT DEFAULT ''")
        _ensure_column(conn, 'leads', 'reply_at', "TEXT DEFAULT ''")

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
        # Which review a manager is currently composing a reply for (if any)
        _ensure_column(conn, 'manager_state', 'reply_lead_id', 'INTEGER')

        # Small key/value store for one-off migration flags
        conn.execute('''
            CREATE TABLE IF NOT EXISTS app_meta (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ''')

    seed_initial_reviews()


def _ensure_column(conn, table, column, decl):
    """Add a column to an existing table if it is not already present."""
    cols = [r['name'] for r in conn.execute(f'PRAGMA table_info({table})').fetchall()]
    if column not in cols:
        conn.execute(f'ALTER TABLE {table} ADD COLUMN {column} {decl}')


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
            "SELECT id, name, country, comment, reply, reply_at, created_at FROM leads "
            "WHERE event_type = 'Review' AND status = 'approved' "
            "ORDER BY created_at DESC LIMIT ?",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


def get_reviews(status=None, limit=50):
    """All reviews (any status) for the manager bot, newest first."""
    with get_db() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM leads WHERE event_type = 'Review' AND status = ? "
                "ORDER BY created_at DESC LIMIT ?",
                (status, limit)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM leads WHERE event_type = 'Review' "
                "ORDER BY created_at DESC LIMIT ?",
                (limit,)
            ).fetchall()
        return [dict(r) for r in rows]


def get_review_counts():
    with get_db() as conn:
        row = conn.execute('''
            SELECT
                SUM(CASE WHEN status='moderation' THEN 1 ELSE 0 END) as moderation,
                SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected
            FROM leads WHERE event_type = 'Review'
        ''').fetchone()
        return {k: (row[k] or 0) for k in ('moderation', 'approved', 'rejected')}


def set_lead_reply(lead_id, reply):
    reply_at = datetime.utcnow().isoformat()
    with get_db() as conn:
        conn.execute(
            'UPDATE leads SET reply = ?, reply_at = ? WHERE id = ?',
            (reply, reply_at, lead_id)
        )


def delete_lead(lead_id):
    with get_db() as conn:
        conn.execute('DELETE FROM leads WHERE id = ?', (lead_id,))


def get_meta(key):
    with get_db() as conn:
        r = conn.execute('SELECT value FROM app_meta WHERE key = ?', (key,)).fetchone()
        return r['value'] if r else None


def set_meta(key, value):
    with get_db() as conn:
        conn.execute(
            'INSERT INTO app_meta (key, value) VALUES (?, ?) '
            'ON CONFLICT(key) DO UPDATE SET value = excluded.value',
            (key, str(value))
        )


# The three curated testimonials that used to live as static cards on the
# homepage. Seeded once into the DB as published reviews so they show on the
# site via /api/reviews AND can be managed (deleted/answered) from the bot.
# German text — the site's primary locale.
_INITIAL_REVIEWS = [
    ('Anna und Dmitrij',
     'PARTY TALES hat unsere Hochzeit unglaublich gemacht! Der Bogen war so schön, '
     'dass die Gäste den ganzen Abend fotografiert haben. Danke für die Sensibilität '
     'und Professionalität!',
     '2026-06-03T12:00:00'),
    ('Elena',
     'Wir haben die Dekoration für den 5. Geburtstag unserer Tochter bestellt. '
     'Einhorn-Motto — alles war perfekt! Die Kinder waren begeistert und die Ballons '
     'hielten noch eine Woche nach dem Fest.',
     '2026-06-02T12:00:00'),
    ('Olga',
     'Unglaubliche Kompositionen! Habe eine Überraschung für meinen Mann bestellt — '
     'ein Zimmer mit Ballons bis zur Decke. Die Emotionen waren überwältigend. '
     'Danke an das PARTY TALES Team!',
     '2026-06-01T12:00:00'),
]


def seed_initial_reviews():
    """Insert the original homepage testimonials as published reviews, once.

    Guarded by an app_meta flag so they are never re-inserted — in particular,
    if a manager later deletes them from the bot, they stay gone. Each insert is
    additionally guarded by WHERE NOT EXISTS (keyed on the deterministic
    created_at + name) so two gunicorn workers booting at once can't duplicate.
    """
    if get_meta('static_reviews_seeded'):
        return
    with get_db() as conn:
        for name, comment, created_at in _INITIAL_REVIEWS:
            conn.execute(
                "INSERT INTO leads (name, phone, country, event_type, comment, "
                "page_url, language, created_at, status) "
                "SELECT ?, '', '', 'Review', ?, '', 'de', ?, 'approved' "
                "WHERE NOT EXISTS ("
                "  SELECT 1 FROM leads WHERE event_type = 'Review' "
                "  AND created_at = ? AND name = ?)",
                (name, comment, created_at, created_at, name)
            )
    set_meta('static_reviews_seeded', '1')


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


def clear_session_manager(session_id):
    """Unbind the manager from a session (they left) so the assistant takes over
    again. Status goes back to 'waiting' — nobody human is on the chat now."""
    with get_db() as conn:
        conn.execute(
            "UPDATE chat_sessions SET manager_chat_id = '', status = 'waiting' WHERE id = ?",
            (session_id,)
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


def set_manager_reply_target(chat_id, lead_id):
    """Mark that this manager's next plain message is a reply to the given review."""
    with get_db() as conn:
        conn.execute(
            'INSERT INTO manager_state (chat_id, reply_lead_id) VALUES (?, ?) '
            'ON CONFLICT(chat_id) DO UPDATE SET reply_lead_id = excluded.reply_lead_id',
            (str(chat_id), lead_id)
        )


def get_manager_reply_target(chat_id):
    with get_db() as conn:
        r = conn.execute(
            'SELECT reply_lead_id FROM manager_state WHERE chat_id = ?', (str(chat_id),)
        ).fetchone()
        return r['reply_lead_id'] if r else None


def clear_manager_reply_target(chat_id):
    with get_db() as conn:
        conn.execute(
            'UPDATE manager_state SET reply_lead_id = NULL WHERE chat_id = ?', (str(chat_id),)
        )
