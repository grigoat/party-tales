#!/usr/bin/env bash
export PYTHONPATH=backend
exec gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --access-logfile -
