import logging

import database
from telegram.client import tg_send
from telegram.messages import (
    format_chat_notification, chat_join_keyboard, escape, EMOJI_PERSON,
)
from config import CHAT_ID, TOKEN

logger = logging.getLogger(__name__)

MAX_TEXT = 2000
MAX_NAME = 100


def _clean(value, limit):
    return (value or '').strip()[:limit]


def post_visitor_message(data):
    """Visitor sends a message from the website widget.

    Creates a session on the first message and notifies managers in Telegram.
    Returns (result_dict, http_status).
    """
    visitor_id = _clean(data.get('visitor_id'), 64)
    text = _clean(data.get('text'), MAX_TEXT)
    session_id = data.get('session_id')

    if not visitor_id:
        return {'error': 'visitor_id required'}, 400
    if not text:
        return {'error': 'empty message'}, 400

    session = None
    if session_id:
        session = database.get_chat_session(session_id)
        if session and session.get('visitor_id') != visitor_id:
            # session_id does not belong to this visitor — ignore it
            session = None

    is_new = session is None
    if is_new:
        session_id = database.create_chat_session(
            visitor_id=visitor_id,
            name=_clean(data.get('name'), MAX_NAME),
            page_url=_clean(data.get('page_url'), 500),
            language=_clean(data.get('language'), 10),
        )
        session = database.get_chat_session(session_id)

    msg_id = database.add_chat_message(session_id, 'visitor', text)

    _notify_manager(session, text, is_new)

    return {'ok': True, 'session_id': session_id, 'message_id': msg_id}, 201


def _notify_manager(session, text, is_new):
    if not TOKEN or not CHAT_ID:
        logger.warning('TG_BOT_TOKEN or TG_CHAT_ID not set, chat message not delivered to manager')
        return

    session_id = session['id']
    manager_chat_id = session.get('manager_chat_id')

    if manager_chat_id:
        # A manager already joined — forward straight into their conversation.
        name = session.get('name') or f'#{session_id}'
        tg_send(manager_chat_id, f'{EMOJI_PERSON} <b>{escape(name)}:</b> {escape(text)}')
        return

    if is_new:
        # First message of a brand-new session — send the joinable card.
        notif = format_chat_notification(session, text)
        resp = tg_send(CHAT_ID, notif, reply_markup=chat_join_keyboard(session_id))
        try:
            mid = resp['result']['message_id'] if resp and resp.get('ok') else None
        except (KeyError, TypeError):
            mid = None
        if mid:
            database.set_session_tg_message(session_id, mid)
    else:
        # Ongoing session, nobody joined yet — keep the manager updated.
        tg_send(
            CHAT_ID,
            f'{EMOJI_PERSON} <b>Гость #{session_id}:</b> {escape(text)}',
            reply_markup=chat_join_keyboard(session_id),
        )


def post_manager_message(session_id, text):
    """A manager typed a reply in Telegram while bound to this session."""
    session = database.get_chat_session(session_id)
    if not session:
        return None
    msg_id = database.add_chat_message(session_id, 'manager', text[:MAX_TEXT])
    return msg_id


def add_system_message(session_id, text):
    return database.add_chat_message(session_id, 'system', text[:MAX_TEXT])


def poll_messages(session_id, visitor_id, after_id=0):
    """Visitor polls for manager/system replies."""
    session = database.get_chat_session(session_id)
    if not session or session.get('visitor_id') != visitor_id:
        return {'error': 'not found'}, 404

    messages = database.get_chat_messages(
        session_id, after_id=after_id, senders=('manager', 'system')
    )
    return {
        'status': session['status'],
        'manager_joined': bool(session.get('manager_chat_id')),
        'messages': [
            {'id': m['id'], 'sender': m['sender'], 'text': m['text'], 'created_at': m['created_at']}
            for m in messages
        ],
    }, 200
