import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

from app import app

if __name__ == '__main__':
    from database import init_db
    from config import HOST, PORT, WEBHOOK_URL
    from telegram.client import set_webhook

    init_db()

    if WEBHOOK_URL:
        set_webhook(WEBHOOK_URL)

    logger.info('starting server on %s:%s', HOST, PORT)
    app.run(host=HOST, port=PORT, debug=False)
