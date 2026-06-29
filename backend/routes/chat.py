import logging

from flask import Blueprint, request, jsonify

from services.chat_service import post_visitor_message, poll_messages

logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/api/chat/send', methods=['POST'])
def chat_send():
    data = request.get_json(silent=True) or {}
    result, status = post_visitor_message(data)
    return jsonify(result), status


@chat_bp.route('/api/chat/poll', methods=['GET'])
def chat_poll():
    session_id = request.args.get('session_id', type=int)
    visitor_id = (request.args.get('visitor_id') or '').strip()
    after_id = request.args.get('after', 0, type=int)

    if not session_id or not visitor_id:
        return jsonify({'error': 'session_id and visitor_id required'}), 400

    result, status = poll_messages(session_id, visitor_id, after_id=after_id)
    return jsonify(result), status
