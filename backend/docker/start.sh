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

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  php artisan db:seed --force
fi

PORT_TO_BIND="${PORT:-10000}"

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
