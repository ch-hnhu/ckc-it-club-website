#!/usr/bin/env sh
set -eu

cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
  if [ -f .env ]; then
    php artisan key:generate --force
  else
    echo "APP_KEY is required when no .env file is present. Set APP_KEY in the deployment environment."
    exit 1
  fi
fi

# Clear cache để tránh các lỗi config/route cũ
php artisan config:clear
php artisan route:clear
php artisan view:clear

APP_ROLE="${APP_ROLE:-web}"

if [ "$APP_ROLE" = "reverb" ]; then
  PORT_TO_BIND="${PORT:-${REVERB_SERVER_PORT:-8080}}"
  exec php artisan reverb:start --host=0.0.0.0 --port="$PORT_TO_BIND"
fi

PORT_TO_BIND="${PORT:-10000}"

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  php artisan db:seed --force
fi

cat >/etc/nginx/http.d/default.conf <<'NGINXCONF'
server {
    listen       0.0.0.0:${PORT_TO_BIND};
    server_name  _;

    root /var/www/html/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_index index.php;
        fastcgi_pass 127.0.0.1:9000;
    }

    location ~ /\. {
        deny all;
    }
}
NGINXCONF

sed -i "s/\${PORT_TO_BIND}/${PORT_TO_BIND}/g" /etc/nginx/http.d/default.conf

php-fpm -D
exec nginx -g 'daemon off;'
