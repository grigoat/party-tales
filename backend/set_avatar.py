import sys
import os
import requests

from config import TOKEN

PHOTO = os.path.join(os.path.dirname(__file__), '..', 'images', 'logo.png')

if len(sys.argv) > 1:
    PHOTO = sys.argv[1]

if not TOKEN:
    print('Ошибка: TG_BOT_TOKEN не задан')
    sys.exit(1)

url = f'https://api.telegram.org/bot{TOKEN}/setUserProfilePhotos'

try:
    with open(PHOTO, 'rb') as f:
        r = requests.post(url, files={'photo': f}, timeout=15)
    data = r.json()
    if data.get('ok'):
        print('Аватар поставлен!')
    else:
        print('Ошибка:', data.get('description'))
except FileNotFoundError:
    print(f'Файл не найден: {PHOTO}')
except Exception as e:
    print(f'Ошибка: {e}')
