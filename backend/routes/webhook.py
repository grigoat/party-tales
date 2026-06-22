import logging

from flask import Blueprint, request, jsonify

from telegram.client import verify_webhook, answer_callback
from telegram.handlers import handle_message, handle_callback

logger = logging.getLogger(__name__)

webhook_bp = Blueprint('webhook', __name__)


@webhook_bp.route('/telegram-webhook', methods=['POST'])
def telegram_webhook():
    if not verify_webhook(request):
        return jsonify({'error': 'forbidden'}), 403

    update = request.get_json(silent=True) or {}
    message = update.get('message') or {}
    callback_query = update.get('callback_query') or {}

    if callback_query:
        cq_id = callback_query.get('id', '')
        chat = callback_query.get('message', {}).get('chat') or {}
        message_id = callback_query.get('message', {}).get('message_id')
        chat_id = chat.get('id')
        callback_data = callback_query.get('data', '')

        answer_callback(cq_id)

        if chat_id and callback_data:
            handle_callback(chat_id, callback_data, message_id=message_id)
        return 'ok', 200

    if message:
        chat = message.get('chat') or {}
        chat_id = chat.get('id')
        text = message.get('text', '').strip()
        if text and chat_id:
            handle_message(chat_id, text)

    return 'ok', 200
