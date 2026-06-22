import logging

from flask import Blueprint, request, jsonify

import database
from config import API_KEY
from services.lead_service import create_lead

logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)


def require_api_key():
    if not API_KEY:
        return None
    key = request.headers.get('X-API-Key', '')
    if key != API_KEY:
        return jsonify({'error': 'unauthorized'}), 401
    return None


@api_bp.route('/api/lead', methods=['POST'])
def receive_lead():
    data = request.get_json(silent=True) or {}
    result, status = create_lead(data)
    return jsonify(result), status


@api_bp.route('/api/leads', methods=['GET'])
def list_leads():
    auth_error = require_api_key()
    if auth_error:
        return auth_error

    limit = request.args.get('limit', 10, type=int)
    offset = request.args.get('offset', 0, type=int)
    status = request.args.get('status', None)

    limit = min(max(limit, 1), 100)
    offset = max(offset, 0)

    leads = database.get_leads(limit=limit, offset=offset, status=status)
    return jsonify(leads)


@api_bp.route('/api/lead/<int:lead_id>', methods=['GET'])
def get_lead_api(lead_id):
    auth_error = require_api_key()
    if auth_error:
        return auth_error

    lead = database.get_lead(lead_id)
    if not lead:
        return jsonify({'error': 'not found'}), 404
    return jsonify(lead)


@api_bp.route('/api/stats', methods=['GET'])
def stats_api():
    auth_error = require_api_key()
    if auth_error:
        return auth_error

    return jsonify(database.get_stats())
