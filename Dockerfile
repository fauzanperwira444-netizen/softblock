# DP-2: satu image berisi SPA hasil build, Laravel, php-fpm, dan nginx.
# Bangun: docker build --build-arg BUILD_SHA=$(git rev-parse --short HEAD) -t softblock .
ARG BUILD_SHA=dev

FROM node:24-alpine AS web
ARG BUILD_SHA
WORKDIR /src
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter web
COPY apps/web apps/web
COPY fixtures fixtures
# X-Build klien harus sama dengan APP_BUILD server (N-76).
RUN VITE_BUILD=$BUILD_SHA pnpm --filter web build

# Paket gratis SnapDeploy membatasi Dockerfile pada 2 stage, jadi Composer berjalan di stage akhir.
FROM php:8.4-fpm-alpine
ARG BUILD_SHA
RUN apk add --no-cache nginx icu-libs libpq \
    && apk add --no-cache --virtual .bangun $PHPIZE_DEPS icu-dev postgresql-dev \
    && docker-php-ext-install pdo_pgsql intl opcache \
    && apk del .bangun

WORKDIR /var/www
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY apps/api/composer.json apps/api/composer.lock ./
RUN apk add --no-cache --virtual .composer git unzip \
    && COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-cache \
    && apk del .composer
COPY apps/api ./
RUN COMPOSER_ALLOW_SUPERUSER=1 composer dump-autoload --no-dev --optimize --classmap-authoritative \
    && rm /usr/local/bin/composer
COPY --from=web /src/apps/web/dist ./public/
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/nginx-keamanan.conf /etc/nginx/keamanan.conf
COPY docker/mulai.sh /usr/local/bin/mulai

ENV APP_ENV=production \
    APP_DEBUG=false \
    APP_BUILD=$BUILD_SHA \
    LOG_CHANNEL=stderr \
    DB_CONNECTION=pgsql \
    SESSION_COOKIE=__Host-softblock \
    SESSION_SECURE_COOKIE=true \
    TRUSTED_PROXIES=*

RUN chmod +x /usr/local/bin/mulai \
    && rm -f bootstrap/cache/*.php \
    && php artisan package:discover \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8080
CMD ["mulai"]
