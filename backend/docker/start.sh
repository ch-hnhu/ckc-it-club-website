#!/usr/bin/env sh
set -eu

cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
  php artisan key:generate --force
fi

# Clear cache để tránh các lỗi config/route cũ
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 1. Chạy Migration:
php artisan migrate --force

# 2. Chạy Seeder
php artisan migrate --force --seed

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
