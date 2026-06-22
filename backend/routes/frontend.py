import os

from flask import Blueprint, send_from_directory

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', '..')

frontend_bp = Blueprint('frontend', __name__)


@frontend_bp.route('/')
def frontend_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@frontend_bp.route('/<path:filename>')
def frontend_static(filename):
    filepath = os.path.join(FRONTEND_DIR, filename)
    if os.path.isfile(filepath):
        return send_from_directory(FRONTEND_DIR, filename)
    html_path = os.path.join(FRONTEND_DIR, filename + '.html')
    if os.path.isfile(html_path):
        return send_from_directory(FRONTEND_DIR, filename + '.html')
    return send_from_directory(FRONTEND_DIR, 'index.html'), 404
