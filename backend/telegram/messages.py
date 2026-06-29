import html

EMOJI_GREEN = '\U0001F7E2'
EMOJI_YELLOW = '\U0001F7E1'
EMOJI_BLACK = '\u26AB'
EMOJI_BELL = '\U0001F514'
EMOJI_GLOBE = '\U0001F310'
EMOJI_PUSH = '\U0001F4CD'
EMOJI_CAL = '\U0001F4C5'
EMOJI_CHART = '\U0001F4CA'
EMOJI_WAVE = '\U0001F44B'
EMOJI_ARROW = '\u2192'
EMOJI_PERSON = '\U0001F464'
EMOJI_SPEECH = '\U0001F4AC'
EMOJI_DOOR = '\U0001F6AA'

COMMANDS = {
    '/start': (
        f'{EMOJI_WAVE} Привет! Я бот для заявок '
        'с сайта Party Tales.\n\n'
        'Команды:\n'
        '/leads — свежие заявки\n'
        '/lead_N — детали заявки\n'
        '/status_N_new|contacted|closed — сменить статус\n'
        '/stats — статистика'
    ),
    '/help': (
        '/leads — свежие заявки\n'
        '/lead_N — детали заявки\n'
        '/status_N_new|contacted|closed — сменить статус\n'
        '/stats — статистика\n'
        '/leave — выйти из чата с гостем\n\n'
        '💬 Когда гость пишет в чат на сайте, придёт уведомление с кнопкой '
        '«Войти в переписку» — нажмите её и просто отвечайте сообщениями.'
    ),
}

STATUS_ICONS = {
    'new': EMOJI_GREEN,
    'contacted': EMOJI_YELLOW,
    'closed': EMOJI_BLACK,
    'moderation': '\U0001F7E3',  # purple
    'approved': '\U0001F7E2',
    'rejected': '\u274C',
}


def escape(text):
    return html.escape(str(text), quote=False)


def format_lead(lead):
    lines = [
        f'<b>{EMOJI_BELL} Заявка #{lead["id"]}</b>',
        '',
        f'<b>Имя:</b> {escape(lead["name"])}',
        f'<b>Телефон:</b> {escape(lead["country"])} {escape(lead["phone"])}',
    ]
    if lead.get('event_type'):
        lines.append(f'<b>Мероприятие:</b> {escape(lead["event_type"])}')
    if lead.get('comment'):
        lines.append(f'<b>Пожелания:</b> {escape(lead["comment"])}')
    lines += [
        '',
        f'{EMOJI_GLOBE} Язык: {escape(lead["language"])}',
        f'{EMOJI_PUSH} Страница: {escape(lead["page_url"])}',
        f'{EMOJI_CAL} {lead["created_at"]}',
        f'{STATUS_ICONS.get(lead["status"], EMOJI_GREEN)} Статус: {lead["status"]}',
    ]
    return '\n'.join(lines)


def format_lead_card(lead):
    text = format_lead(lead)
    status = lead['status']
    reply_markup = {
        'inline_keyboard': [[
            {
                'text': f'{EMOJI_GREEN} Новый',
                'callback_data': f'status_{lead["id"]}_new'
            },
            {
                'text': f'{EMOJI_YELLOW} В работе',
                'callback_data': f'status_{lead["id"]}_contacted'
            },
            {
                'text': f'{EMOJI_BLACK} Закрыт',
                'callback_data': f'status_{lead["id"]}_closed'
            },
        ], [
            {
                'text': '📋 Все заявки',
                'callback_data': 'leads'
            },
            {
                'text': '📊 Статистика',
                'callback_data': 'stats'
            },
        ]]
    }
    return text, reply_markup


def format_leads_list(leads):
    if not leads:
        return 'Нет заявок.'
    lines = [f'<b>Заявки ({len(leads)}):</b>', '']
    for l in leads:
        icon = STATUS_ICONS.get(l['status'], EMOJI_GREEN)
        phone = f'{escape(l["country"])} {escape(l["phone"])}' if l.get('phone') else ''
        lines.append(f'{icon} #{l["id"]} {escape(l["name"])} — {phone} ({l["created_at"][:10]})')
    return '\n'.join(lines)


def format_stats(stats):
    return (
        f'<b>Статистика</b>\n'
        f'{EMOJI_GREEN} Новые: {stats["new"]}\n'
        f'{EMOJI_YELLOW} В работе: {stats["contacted"]}\n'
        f'{EMOJI_BLACK} Закрыто: {stats["closed"]}\n'
        f'{EMOJI_CHART} Всего: {stats["total"]}'
    )


EMOJI_CHECK = '\u2705'
EMOJI_CROSS = '\u274C'
EMOJI_PURPLE = '\U0001F7E3'


def format_review_card(lead):
    text = format_lead(lead)
    reply_markup = {
        'inline_keyboard': [[
            {
                'text': f'{EMOJI_CHECK} Approve',
                'callback_data': f'approve_review_{lead["id"]}'
            },
            {
                'text': f'{EMOJI_CROSS} Reject',
                'callback_data': f'reject_review_{lead["id"]}'
            },
        ]]
    }
    return text, reply_markup


# ============================ Live chat ============================

def format_chat_notification(session, first_text):
    name = session.get('name') or 'Гость'
    lines = [
        f'<b>{EMOJI_SPEECH} Новый чат на сайте — #{session["id"]}</b>',
        '',
        f'{EMOJI_PERSON} <b>{escape(name)}:</b> {escape(first_text)}',
        '',
        f'{EMOJI_GLOBE} Язык: {escape(session.get("language") or "—")}',
        f'{EMOJI_PUSH} Страница: {escape(session.get("page_url") or "—")}',
        '',
        'Нажмите кнопку, чтобы ответить гостю прямо отсюда.',
    ]
    return '\n'.join(lines)


def chat_join_keyboard(session_id):
    return {
        'inline_keyboard': [[
            {
                'text': f'{EMOJI_SPEECH} Войти в переписку',
                'callback_data': f'chat_join_{session_id}'
            },
        ]]
    }


def format_chat_joined(session, history):
    name = session.get('name') or f'Гость #{session["id"]}'
    lines = [
        f'<b>{EMOJI_SPEECH} Вы в переписке с {escape(name)} (#{session["id"]})</b>',
        '',
    ]
    if history:
        for m in history:
            who = 'Гость' if m['sender'] == 'visitor' else ('Вы' if m['sender'] == 'manager' else '•')
            lines.append(f'<b>{who}:</b> {escape(m["text"])}')
        lines.append('')
    lines.append('✍️ Просто пишите сообщения — гость увидит их на сайте.')
    lines.append('/leave — выйти из чата.')
    return '\n'.join(lines)


def chat_leave_keyboard(session_id):
    return {
        'inline_keyboard': [[
            {
                'text': f'{EMOJI_DOOR} Выйти из чата',
                'callback_data': 'chat_leave'
            },
        ]]
    }
