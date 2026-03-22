#!/usr/bin/env sh
set -eu

cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
  php artisan key:generate --force
fi

php artisan config:clear
php artisan route:clear
php artisan view:clear

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
