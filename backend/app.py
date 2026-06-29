import logging
from datetime import datetime

from flask import Flask, jsonify
from flask_cors import CORS

import threading

from config import HOST, PORT, WEBHOOK_URL, TOKEN
from database import init_db
from routes.api import api_bp
from routes.webhook import webhook_bp
from routes.frontend import frontend_bp
from routes.chat import chat_bp
from telegram.client import set_webhook, set_my_commands
from telegram.messages import BOT_COMMANDS

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

_telegram_setup_done = False


def _setup_telegram():
    """Register the webhook + command menu. Runs once, in the background, so a
    slow Telegram API call never blocks app startup / the health check."""
    global _telegram_setup_done
    if _telegram_setup_done or not TOKEN:
        return
    _telegram_setup_done = True

    def worker():
        try:
            set_my_commands(BOT_COMMANDS)
        except Exception as e:
            logger.error('set_my_commands failed: %s', e)
        if WEBHOOK_URL:
            try:
                set_webhook(WEBHOOK_URL)
            except Exception as e:
                logger.error('set_webhook failed: %s', e)
        else:
            logger.warning('WEBHOOK_URL not set — bot will not receive button taps / messages')

    threading.Thread(target=worker, daemon=True).start()


def create_app():
    app = Flask(__name__)
    CORS(app)

    try:
        init_db()
    except Exception as e:
        logger.error('init_db at startup failed: %s', e)

    app.register_blueprint(api_bp)
    app.register_blueprint(webhook_bp)
    app.register_blueprint(frontend_bp)
    app.register_blueprint(chat_bp)

    _setup_telegram()

    @app.route('/health')
    def health():
        db_ok = False
        try:
            import database as db_module
            db_module.init_db()
            db_module.get_stats()
            db_ok = True
        except Exception as e:
            logger.error('health check db error: %s', e)

        return jsonify({
            'status': 'ok',
            'db': db_ok,
            'tg_configured': bool(TOKEN),
            'timestamp': datetime.utcnow().isoformat(),
        })

    return app


app = create_app()


if __name__ == '__main__':
    init_db()

    if WEBHOOK_URL:
        set_webhook(WEBHOOK_URL)

    logger.info('starting server on %s:%s', HOST, PORT)
    app.run(host=HOST, port=PORT, debug=False)
