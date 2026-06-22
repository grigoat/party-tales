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
        '/stats — статистика'
    ),
}

STATUS_ICONS = {
    'new': EMOJI_GREEN,
    'contacted': EMOJI_YELLOW,
    'closed': EMOJI_BLACK,
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
