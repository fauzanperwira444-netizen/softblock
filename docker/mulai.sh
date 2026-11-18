#!/bin/sh
set -e

# Render memberi port lewat $PORT.
sed -i "s/listen 8080;/listen ${PORT:-8080};/" /etc/nginx/http.d/default.conf

# Cache dibangun saat start karena butuh variabel lingkungan produksi. Migrasi dijalankan job Deploy (DP-4), bukan di sini.
php artisan config:cache
php artisan route:cache

php-fpm -D
exec nginx -g 'daemon off;'
