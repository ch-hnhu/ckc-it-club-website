FROM php:8.4-fpm-alpine

WORKDIR /var/www/html

RUN apk add --no-cache \
    bash \
    curl \
    git \
    nginx \
    unzip \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    mysql-client \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql mbstring bcmath intl zip pcntl gd \
    && rm -rf /var/cache/apk/*

# ── Render chứng chỉ (Browsershot/Chrome headless) ───────────────────────────
# Chứng chỉ dùng editor canvas (Konva) được render bằng spatie/browsershot, cần
# Node + Chromium. Dùng Chromium hệ thống (không qua puppeteer) để tránh tải Chromium 2 lần.
RUN apk add --no-cache nodejs npm chromium nss freetype harfbuzz ttf-freefont font-noto \
    && npm install -g puppeteer-core
ENV BROWSERSHOT_CHROME_PATH=/usr/bin/chromium-browser
# (Trong CertificateRenderer, gọi ->setChromePath(env('BROWSERSHOT_CHROME_PATH'))
#  khi biến này được set; dev macOS dùng puppeteer cài trong backend/node_modules.)

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/start.sh /usr/local/bin/start-container
RUN chmod +x /usr/local/bin/start-container

EXPOSE 10000 8080

ENTRYPOINT ["start-container"]
