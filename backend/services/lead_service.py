import logging

import database
from telegram.client import tg_send
from telegram.messages import format_lead, format_review_card
from config import CHAT_ID, TOKEN

logger = logging.getLogger(__name__)

FIELD_LIMITS = {
    'name': 100,
    'phone': 30,
    'country': 10,
    'event_type': 200,
    'comment': 2000,
    'page_url': 500,
    'language': 10,
}


def validate_lead_data(data: dict) -> tuple[dict | None, str | None]:
    errors = []
    cleaned = {}
    fields_over_limit = set()

    for field in ('name', 'phone', 'country', 'event_type', 'comment', 'page_url', 'language'):
        value = (data.get(field) or '').strip()
        max_len = FIELD_LIMITS.get(field)
        if max_len and len(value) > max_len:
            errors.append(f'{field} превышает {max_len} символов')
            fields_over_limit.add(field)
        cleaned[field] = value

    if not cleaned.get('name') and 'name' not in fields_over_limit:
        errors.append('name обязателен')
    if not cleaned.get('phone') and 'phone' not in fields_over_limit and cleaned.get('event_type') != 'Review':
        errors.append('phone обязателен')

    if errors:
        return None, '; '.join(errors)

    return cleaned, None


def create_lead(data: dict) -> tuple[dict | None, int | None]:
    cleaned, error = validate_lead_data(data)
    if error:
        return {'error': error}, 400

    lead_id = database.add_lead(
        name=cleaned['name'],
        phone=cleaned['phone'],
        country=cleaned['country'],
        event_type=cleaned['event_type'],
        comment=cleaned['comment'],
        page_url=cleaned['page_url'],
        language=cleaned['language'],
    )

    if cleaned.get('event_type') == 'Review':
        database.update_lead_status(lead_id, 'moderation')
    else:
        database.update_lead_status(lead_id, 'new')

    notify_managers(lead_id)
    return {'ok': True, 'id': lead_id}, 201


def notify_managers(lead_id: int):
    if not TOKEN or not CHAT_ID:
        logger.warning('TG_BOT_TOKEN or TG_CHAT_ID not set')
        return

    lead = database.get_lead(lead_id)
    if not lead:
        logger.warning('lead %s not found for notification', lead_id)
        return

    if lead.get('event_type') == 'Review':
        text, reply_markup = format_review_card(lead)
        tg_send(CHAT_ID, text, reply_markup=reply_markup)
    else:
        text = format_lead(lead)
        tg_send(CHAT_ID, text)
