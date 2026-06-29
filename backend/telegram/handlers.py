import logging

from database import (
    get_leads, get_lead, update_lead_status, get_stats,
    get_chat_session, get_chat_messages, set_session_manager, set_session_status,
    set_manager_active, get_manager_active, clear_manager_active,
)
from telegram.client import tg_send, edit_message_text
from telegram.messages import (
    COMMANDS, format_lead_card, format_leads_list, format_review_card, format_stats, escape, EMOJI_ARROW,
    format_chat_joined, chat_leave_keyboard, EMOJI_DOOR,
)

logger = logging.getLogger(__name__)


def parse_command(text):
    text = text.strip()
    parts = text.split()
    if not parts:
        return None, []
    cmd = parts[0].lower()
    args = parts[1:]
    return cmd, args


def handle_message(chat_id: int | str, text: str):
    # If the manager is currently inside a website chat, plain text (anything
    # that is not a /command) is relayed to that visitor.
    if not text.startswith('/'):
        active_sid = get_manager_active(chat_id)
        if active_sid:
            from services.chat_service import post_manager_message
            if post_manager_message(active_sid, text):
                return

    cmd, args = parse_command(text)
    if cmd:
        handle_command(cmd, args, chat_id)


def _leave_chat(chat_id, message_id=None):
    sid = get_manager_active(chat_id)
    clear_manager_active(chat_id)
    if sid:
        from services.chat_service import add_system_message
        add_system_message(sid, '__manager_left__')
        tg_send(chat_id, f'{EMOJI_DOOR} Вы вышли из чата #{sid}. Новые сообщения снова придут уведомлением.')
    else:
        tg_send(chat_id, 'Вы сейчас не в чате.')


def handle_chat_join(chat_id, session_id, message_id=None):
    session = get_chat_session(session_id)
    if not session:
        tg_send(chat_id, f'Чат #{session_id} не найден.')
        return
    set_session_manager(session_id, chat_id)
    set_manager_active(chat_id, session_id)

    from services.chat_service import add_system_message
    add_system_message(session_id, '__manager_joined__')

    history = get_chat_messages(session_id, after_id=0, senders=('visitor', 'manager'))
    text = format_chat_joined(session, history)
    if message_id:
        edit_message_text(chat_id, message_id, text, reply_markup=chat_leave_keyboard(session_id))
    else:
        tg_send(chat_id, text, reply_markup=chat_leave_keyboard(session_id))


def handle_callback(chat_id: int | str, callback_data: str, message_id: int | None = None):
    cmd, args = parse_command(callback_data)

    if cmd.startswith('chat_join_'):
        try:
            sid = int(cmd[len('chat_join_'):])
        except ValueError:
            return
        handle_chat_join(chat_id, sid, message_id=message_id)
        return

    if cmd == 'chat_leave':
        _leave_chat(chat_id, message_id=message_id)
        return

    if cmd == 'leads':
        leads = get_leads(limit=10)
        text = format_leads_list(leads)
        tg_send(chat_id, text)
        return

    if cmd == 'stats':
        s = get_stats()
        tg_send(chat_id, format_stats(s))
        return

    if cmd in ('status',) or cmd.startswith('status_'):
        prefix = 'status_'
        if cmd.startswith('status_'):
            rest = cmd[len('status_'):]
        else:
            rest = ''
        parts = rest.rsplit('_', 1)
        if len(parts) != 2:
            return
        try:
            lead_id = int(parts[0])
        except ValueError:
            return
        new_status = parts[1]
        if new_status not in ('new', 'contacted', 'closed'):
            return
        update_lead_status(lead_id, new_status)
        lead = get_lead(lead_id)
        if lead:
            text, reply_markup = format_lead_card(lead)
            if message_id:
                edit_message_text(chat_id, message_id, text, reply_markup=reply_markup)
            else:
                tg_send(chat_id, text, reply_markup=reply_markup)
        return

    if cmd == 'approve_review':
        try:
            lead_id = int(args[0]) if args else None
        except (ValueError, IndexError):
            return
        if not lead_id:
            return
        update_lead_status(lead_id, 'approved')
        lead = get_lead(lead_id)
        if lead and message_id:
            from telegram.messages import EMOJI_CHECK
            text = f'{EMOJI_CHECK} Approved\n\n' + format_lead(lead)
            edit_message_text(chat_id, message_id, text)
        return

    if cmd == 'reject_review':
        try:
            lead_id = int(args[0]) if args else None
        except (ValueError, IndexError):
            return
        if not lead_id:
            return
        update_lead_status(lead_id, 'rejected')
        lead = get_lead(lead_id)
        if lead and message_id:
            from telegram.messages import EMOJI_CROSS
            text = f'{EMOJI_CROSS} Rejected\n\n' + format_lead(lead)
            edit_message_text(chat_id, message_id, text)
        return

    if cmd:
        handle_command(cmd, args, chat_id)


def handle_command(cmd: str, args: list, chat_id: int | str):
    if cmd == '/leave':
        _leave_chat(chat_id)
        return

    if cmd == '/start':
        tg_send(chat_id, COMMANDS['/start'])
        return

    if cmd == '/help':
        tg_send(chat_id, COMMANDS['/help'])
        return

    if cmd in ('/leads',):
        status = args[0] if args else None
        leads = get_leads(limit=10, status=status)
        text = format_leads_list(leads)
        tg_send(chat_id, text)
        return

    if cmd.startswith('/lead_'):
        try:
            lead_id = int(cmd.replace('/lead_', ''))
        except ValueError:
            tg_send(chat_id, 'Неверный формат. Используйте /lead_123')
            return
        lead = get_lead(lead_id)
        if not lead:
            tg_send(chat_id, f'Заявка #{lead_id} не найдена.')
            return
        text, reply_markup = format_lead_card(lead)
        tg_send(chat_id, text, reply_markup=reply_markup)
        return

    if cmd == '/lead' and args:
        try:
            lead_id = int(args[0])
        except ValueError:
            tg_send(chat_id, 'Неверный формат. Используйте /lead 123')
            return
        lead = get_lead(lead_id)
        if not lead:
            tg_send(chat_id, f'Заявка #{lead_id} не найдена.')
            return
        text, reply_markup = format_lead_card(lead)
        tg_send(chat_id, text, reply_markup=reply_markup)
        return

    if cmd == '/stats':
        s = get_stats()
        tg_send(chat_id, format_stats(s))
        return

    if cmd.startswith('/status_'):
        rest = cmd[len('/status_'):]
        parts = rest.rsplit('_', 1)
        if len(parts) != 2:
            tg_send(chat_id, 'Формат: /status_123_contacted (new/contacted/closed)')
            return
        try:
            lead_id = int(parts[0])
        except ValueError:
            tg_send(chat_id, 'Неверный ID.')
            return
        new_status = parts[1]
        if new_status not in ('new', 'contacted', 'closed'):
            tg_send(chat_id, 'Статус: new, contacted или closed')
            return
        update_lead_status(lead_id, new_status)
        tg_send(chat_id, f'Заявка #{lead_id} {EMOJI_ARROW} {new_status}')
        lead = get_lead(lead_id)
        if lead:
            text, reply_markup = format_lead_card(lead)
            tg_send(chat_id, text, reply_markup=reply_markup)
        return

    tg_send(chat_id, f'Неизвестная команда: {cmd}\n/help — список команд')
