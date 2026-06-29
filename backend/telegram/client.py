import logging

import requests

from config import TOKEN, TG_SECRET_TOKEN

logger = logging.getLogger(__name__)

TG_API = f'https://api.telegram.org/bot{TOKEN}'


def tg_send(chat_id: int | str, text: str, parse_mode: str = 'HTML',
            reply_markup: dict | None = None) -> dict | None:
    if not TOKEN or not chat_id:
        logger.warning('TG_BOT_TOKEN or chat_id not set, skipping tg_send')
        return None
    try:
        payload = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': parse_mode,
        }
        if reply_markup:
            payload['reply_markup'] = reply_markup
        r = requests.post(f'{TG_API}/sendMessage', json=payload, timeout=10)
        r.raise_for_status()
        data = r.json()
        if not data.get('ok'):
            logger.error('tg send failed: %s', data.get('description'))
        return data
    except requests.Timeout:
        logger.error('tg send timeout for chat %s', chat_id)
    except requests.ConnectionError as e:
        logger.error('tg connection error: %s', e)
    except Exception as e:
        logger.exception('tg send error: %s', e)
    return None


def set_webhook(url: str | None = None):
    webhook_url = (url or '').rstrip('/')
    if not webhook_url:
        return
    full_url = f'{webhook_url}/telegram-webhook'
    try:
        payload = {'url': full_url}
        if TG_SECRET_TOKEN:
            payload['secret_token'] = TG_SECRET_TOKEN
        r = requests.post(f'{TG_API}/setWebhook', json=payload, timeout=10)
        r.raise_for_status()
        data = r.json()
        logger.info('webhook set: %s', data)
    except Exception as e:
        logger.error('webhook error: %s', e)


def delete_webhook():
    try:
        r = requests.post(f'{TG_API}/deleteWebhook', timeout=10)
        r.raise_for_status()
        logger.info('webhook deleted')
    except Exception as e:
        logger.error('delete webhook error: %s', e)


def set_my_commands(commands: list[dict]):
    """Register the bot command list (shown in the blue Menu button)."""
    if not TOKEN:
        return
    try:
        r = requests.post(f'{TG_API}/setMyCommands', json={'commands': commands}, timeout=10)
        r.raise_for_status()
        logger.info('bot commands set: %s', r.json().get('ok'))
    except Exception as e:
        logger.error('set commands error: %s', e)


def answer_callback(callback_query_id: str, text: str | None = None):
    if not TOKEN or not callback_query_id:
        return None
    try:
        payload = {'callback_query_id': callback_query_id}
        if text:
            payload['text'] = text
        r = requests.post(f'{TG_API}/answerCallbackQuery', json=payload, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error('answer callback error: %s', e)
        return None


def edit_message_text(chat_id: int | str, message_id: int, text: str,
                      reply_markup: dict | None = None):
    if not TOKEN or not chat_id:
        return None
    try:
        payload = {
            'chat_id': chat_id,
            'message_id': message_id,
            'text': text,
            'parse_mode': 'HTML',
        }
        if reply_markup:
            payload['reply_markup'] = reply_markup
        r = requests.post(f'{TG_API}/editMessageText', json=payload, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error('edit message error: %s', e)
        return None


def verify_webhook(request) -> bool:
    if not TG_SECRET_TOKEN:
        return True
    token = request.headers.get('X-Telegram-Bot-Api-Secret-Token', '')
    if token != TG_SECRET_TOKEN:
        logger.warning('webhook secret token mismatch')
        return False
    return True
