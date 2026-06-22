#!/bin/bash
PORT=${1:-8080}
cd "$(dirname "$0")/backend"
echo "Site: http://localhost:$PORT"
xdg-open "http://localhost:$PORT" 2>/dev/null || open "http://localhost:$PORT" 2>/dev/null
python3 -m gunicorn server:app --bind "0.0.0.0:$PORT" --workers 2 --timeout 120
