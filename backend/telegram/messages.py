import html
import re

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
EMOJI_STAR = '⭐'
EMOJI_STAR_OUTLINE = '☆'
EMOJI_STAR_FULL = '★'
EMOJI_TRASH = '\U0001F5D1'
EMOJI_PENCIL = '✍'
EMOJI_REPLY = '\U0001F4AC'
EMOJI_BACK = '«'
DASH = '—'

COMMANDS = {
    '/start': (
        f'{EMOJI_WAVE} Привет! Я бот PARTY TALES — заявки и живой чат с сайта.\n\n'
        'Откройте /menu или жмите кнопки ниже 👇'
    ),
    '/help': (
        '📋 /menu — главное меню\n'
        '💬 /chats — активные чаты с сайта\n'
        '⭐ /reviews — отзывы с сайта (модерация, ответы, удаление)\n'
        '🆕 /leads — свежие заявки\n'
        '/lead_N — детали заявки\n'
        '/status_N_new|contacted|closed — сменить статус\n'
        '📊 /stats — статистика\n'
        '🚪 /leave — выйти из чата с гостем\n\n'
        '💬 Когда гость пишет в чат на сайте, придёт уведомление с кнопкой '
        '«Войти в переписку» — нажмите её и просто отвечайте сообщениями. '
        'Текст уйдёт гостю на сайт.\n\n'
        '⭐ В разделе «Отзывы» можно опубликовать отзыв на сайт, отклонить или '
        'удалить его, а также написать ответ от Наталии — он появится под отзывом '
        'на сайте.'
    ),
}

BOT_COMMANDS = [
    {'command': 'menu', 'description': '📋 Меню'},
    {'command': 'chats', 'description': '💬 Активные чаты с сайта'},
    {'command': 'reviews', 'description': '⭐ Отзывы с сайта'},
    {'command': 'leads', 'description': '🆕 Свежие заявки'},
    {'command': 'stats', 'description': '📊 Статистика'},
    {'command': 'leave', 'description': '🚪 Выйти из чата с гостем'},
    {'command': 'help', 'description': '❓ Помощь'},
]


def main_menu_keyboard():
    return {
        'inline_keyboard': [
            [
                {'text': '🆕 Свежие заявки', 'callback_data': 'leads'},
                {'text': '📊 Статистика', 'callback_data': 'stats'},
            ],
            [
                {'text': '💬 Активные чаты', 'callback_data': 'chats'},
                {'text': '⭐ Отзывы', 'callback_data': 'reviews'},
            ],
            [
                {'text': f'{EMOJI_GREEN} Новые', 'callback_data': 'leads_new'},
                {'text': f'{EMOJI_YELLOW} В работе', 'callback_data': 'leads_contacted'},
            ],
            [
                {'text': '❓ Помощь', 'callback_data': 'help'},
            ],
        ]
    }


def format_menu():
    text = (
        f'<b>{EMOJI_SPEECH} Меню PARTY TALES</b>\n\n'
        'Выберите действие 👇'
    )
    return text, main_menu_keyboard()


def format_chats_list(sessions):
    if not sessions:
        text = f'{EMOJI_SPEECH} Сейчас нет активных чатов с сайта.'
        return text, {'inline_keyboard': [[{'text': '« Меню', 'callback_data': 'menu'}]]}

    lines = [f'<b>{EMOJI_SPEECH} Активные чаты ({len(sessions)}):</b>', '']
    rows = []
    for s in sessions:
        name = s.get('name') or f'Гость #{s["id"]}'
        waiting = s['status'] == 'waiting'
        mark = '🟢' if waiting else '🟡'
        state = 'ждёт ответа' if waiting else 'в работе'
        lines.append(f'{mark} #{s["id"]} {escape(name)} — {state}')
        rows.append([{
            'text': f'💬 Войти: {name}'[:40],
            'callback_data': f'chat_join_{s["id"]}'
        }])
    rows.append([{'text': '« Меню', 'callback_data': 'menu'}])
    return '\n'.join(lines), {'inline_keyboard': rows}


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

REVIEW_STATUS_LABEL = {
    'moderation': f'{EMOJI_PURPLE} \u041D\u0430 \u043C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u0438',
    'approved': f'{EMOJI_GREEN} \u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D',
    'rejected': f'{EMOJI_CROSS} \u041E\u0442\u043A\u043B\u043E\u043D\u0451\u043D',
}

_RATING_RE = re.compile(r'^\s*Rating:\s*(\d)\s*/\s*5\s*', re.IGNORECASE)


def parse_review(lead):
    """Split a stored review comment into (rating, clean_text).

    Reviews are saved with a leading 'Rating: N/5' line; older ones may not have
    it. Returns rating as int 1..5 (default 5) and the comment without that line.
    """
    comment = (lead.get('comment') or '').strip()
    rating = 5
    m = _RATING_RE.match(comment)
    if m:
        rating = max(1, min(5, int(m.group(1))))
        comment = comment[m.end():].strip()
    return rating, comment


def stars(rating):
    return EMOJI_STAR_FULL * rating + EMOJI_STAR_OUTLINE * (5 - rating)


def format_review(lead):
    rating, text = parse_review(lead)
    name = lead.get('name') or '\u0413\u043E\u0441\u0442\u044C'
    lines = [
        f'<b>{EMOJI_STAR} \u041E\u0442\u0437\u044B\u0432 #{lead["id"]}</b>',
        '',
        f'<b>{escape(name)}</b>  \u00B7  {stars(rating)}',
        '',
        f'<i>\u00AB{escape(text)}\u00BB</i>',
        '',
        f'{REVIEW_STATUS_LABEL.get(lead.get("status"), lead.get("status", ""))}',
        f'{EMOJI_GLOBE} \u042F\u0437\u044B\u043A: {escape(lead.get("language") or DASH)}',
        f'{EMOJI_CAL} {lead.get("created_at", "")[:16].replace("T", " ")}',
    ]
    reply = (lead.get('reply') or '').strip()
    if reply:
        lines += [
            '',
            f'{EMOJI_REPLY} <b>\u041E\u0442\u0432\u0435\u0442 \u041D\u0430\u0442\u0430\u043B\u0438\u0438:</b>',
            f'<i>{escape(reply)}</i>',
        ]
    return '\n'.join(lines)


def review_card_keyboard(lead):
    lid = lead['id']
    status = lead.get('status')
    reply = (lead.get('reply') or '').strip()
    reply_label = '\u270D \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043E\u0442\u0432\u0435\u0442' if reply else '\u270D \u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C'

    rows = []
    if status == 'moderation':
        rows.append([
            {'text': f'{EMOJI_CHECK} \u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C', 'callback_data': f'approve_review_{lid}'},
            {'text': f'{EMOJI_CROSS} \u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C', 'callback_data': f'reject_review_{lid}'},
        ])
    elif status == 'approved':
        rows.append([
            {'text': f'{EMOJI_PURPLE} \u0421\u043D\u044F\u0442\u044C \u0441 \u0441\u0430\u0439\u0442\u0430', 'callback_data': f'reject_review_{lid}'},
        ])
    elif status == 'rejected':
        rows.append([
            {'text': f'{EMOJI_CHECK} \u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C', 'callback_data': f'approve_review_{lid}'},
        ])
    rows.append([
        {'text': reply_label, 'callback_data': f'reply_review_{lid}'},
        {'text': f'{EMOJI_TRASH} \u0423\u0434\u0430\u043B\u0438\u0442\u044C', 'callback_data': f'delreview_{lid}'},
    ])
    rows.append([
        {'text': f'{EMOJI_BACK} \u041A \u043E\u0442\u0437\u044B\u0432\u0430\u043C', 'callback_data': 'reviews'},
    ])
    return {'inline_keyboard': rows}


def format_review_card(lead):
    return format_review(lead), review_card_keyboard(lead)


def delete_review_keyboard(lead_id):
    return {
        'inline_keyboard': [[
            {'text': f'{EMOJI_TRASH} \u0414\u0430, \u0443\u0434\u0430\u043B\u0438\u0442\u044C', 'callback_data': f'delreviewok_{lead_id}'},
            {'text': '\u21A9 \u041E\u0442\u043C\u0435\u043D\u0430', 'callback_data': f'review_{lead_id}'},
        ]]
    }


def format_reviews_menu(counts):
    text = (
        f'<b>{EMOJI_STAR} \u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0442\u0437\u044B\u0432\u0430\u043C\u0438</b>\n\n'
        f'{EMOJI_PURPLE} \u041D\u0430 \u043C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u0438: <b>{counts["moderation"]}</b>\n'
        f'{EMOJI_GREEN} \u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043E: <b>{counts["approved"]}</b>\n'
        f'{EMOJI_CROSS} \u041E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u043E: <b>{counts["rejected"]}</b>\n\n'
        '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435, \u0447\u0442\u043E \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \uD83D\uDC47'
    )
    rows = [
        [{'text': f'{EMOJI_PURPLE} \u041D\u0430 \u043C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u0438 ({counts["moderation"]})',
          'callback_data': 'reviews_moderation'}],
        [{'text': f'{EMOJI_GREEN} \u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u044B\u0435 ({counts["approved"]})',
          'callback_data': 'reviews_approved'}],
    ]
    if counts['rejected']:
        rows.append([{'text': f'{EMOJI_CROSS} \u041E\u0442\u043A\u043B\u043E\u043D\u0451\u043D\u043D\u044B\u0435 ({counts["rejected"]})',
                      'callback_data': 'reviews_rejected'}])
    rows.append([{'text': f'{EMOJI_BACK} \u041C\u0435\u043D\u044E', 'callback_data': 'menu'}])
    return text, {'inline_keyboard': rows}


def format_reviews_list_header(status, count):
    titles = {
        'moderation': f'{EMOJI_PURPLE} \u041E\u0442\u0437\u044B\u0432\u044B \u043D\u0430 \u043C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u0438',
        'approved': f'{EMOJI_GREEN} \u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043E\u0442\u0437\u044B\u0432\u044B',
        'rejected': f'{EMOJI_CROSS} \u041E\u0442\u043A\u043B\u043E\u043D\u0451\u043D\u043D\u044B\u0435 \u043E\u0442\u0437\u044B\u0432\u044B',
    }
    title = titles.get(status, f'{EMOJI_STAR} \u041E\u0442\u0437\u044B\u0432\u044B')
    if not count:
        return f'{title}\n\n\u041F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E.', {
            'inline_keyboard': [[{'text': f'{EMOJI_BACK} \u041A \u043E\u0442\u0437\u044B\u0432\u0430\u043C', 'callback_data': 'reviews'}]]
        }
    return f'<b>{title} ({count})</b>\n\u041A\u0430\u0436\u0434\u044B\u0439 \u043E\u0442\u0437\u044B\u0432 \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0439 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u043E\u0439 \u043D\u0438\u0436\u0435 \uD83D\uDC47', None


def review_reply_prompt(lead):
    rating, text = parse_review(lead)
    name = escape(lead.get('name') or '\u0413\u043E\u0441\u0442\u044C')
    return (
        f'{EMOJI_PENCIL} <b>\u041E\u0442\u0432\u0435\u0442 \u043D\u0430 \u043E\u0442\u0437\u044B\u0432 #{lead["id"]}</b> \u043E\u0442 \u041D\u0430\u0442\u0430\u043B\u0438\u0438\n\n'
        f'<b>{name}</b> \u00B7 {stars(rating)}\n'
        f'<i>\u00AB{escape(text)}\u00BB</i>\n\n'
        '\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u043E\u0442\u0432\u0435\u0442 \u043E\u0434\u043D\u0438\u043C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435\u043C \u2014 \u043E\u043D \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u043F\u043E\u0434 \u043E\u0442\u0437\u044B\u0432\u043E\u043C \u043D\u0430 \u0441\u0430\u0439\u0442\u0435.\n'
        '\u0427\u0442\u043E\u0431\u044B \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C, \u043D\u0430\u0436\u043C\u0438\u0442\u0435 /cancel.'
    )


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
