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
# Node + Chromium. Dùng Chromium hệ thống (không để puppeteer tải Chromium 2 lần).
RUN apk add --no-cache nodejs npm chromium nss freetype harfbuzz ttf-freefont font-noto
ENV BROWSERSHOT_CHROME_PATH=/usr/bin/chromium-browser
# browser.cjs của Browsershot gọi require('puppeteer'); CertificateRenderer ép
# NODE_PATH = /var/www/html/node_modules → BẮT BUỘC cài puppeteer LOCAL (không -g).
# Bỏ tải Chromium riêng của puppeteer vì đã dùng Chromium hệ thống ở trên.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Cài node_modules trước (chỉ dependencies: puppeteer) để tận dụng cache layer,
# không phải cài lại mỗi lần sửa code PHP.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/start.sh /usr/local/bin/start-container
RUN chmod +x /usr/local/bin/start-container

EXPOSE 10000 8080

ENTRYPOINT ["start-container"]
