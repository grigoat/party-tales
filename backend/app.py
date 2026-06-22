import logging
from datetime import datetime

from flask import Flask, jsonify
from flask_cors import CORS

from config import HOST, PORT, WEBHOOK_URL, TOKEN
from database import init_db
from routes.api import api_bp
from routes.webhook import webhook_bp
from routes.frontend import frontend_bp
from telegram.client import set_webhook

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(api_bp)
    app.register_blueprint(webhook_bp)
    app.register_blueprint(frontend_bp)

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
