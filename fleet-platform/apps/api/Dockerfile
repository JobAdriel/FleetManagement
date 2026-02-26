# Builder stage
FROM php:8.3-fpm-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    openssh-client \
    libpq-dev \
    autoconf \
    automake \
    build-base \
    zlib-dev

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    bcmath \
    ctype \
    fileinfo \
    json \
    mbstring \
    tokenizer \
    xml

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy composer files
COPY composer.json composer.lock* ./

# Install PHP dependencies
RUN composer install --no-dev --no-scripts --no-autoloader

# Copy the entire application
COPY . .

# Complete the composer setup
RUN composer dump-autoload --optimize

# Production stage
FROM php:8.3-fpm-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    postgresql-client \
    libpq \
    supervisor \
    bash \
    nginx

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    bcmath \
    ctype \
    fileinfo \
    json \
    mbstring \
    tokenizer \
    xml

# Install Redis extension
RUN apk add --no-cache redis

# Copy PHP configuration
COPY docker/php.ini /usr/local/etc/php/conf.d/99-custom.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zz-custom.conf

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx-app.conf /etc/nginx/conf.d/default.conf

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy application from builder
COPY --from=builder /app .

# Create necessary directories
RUN mkdir -p /app/storage/logs \
    /app/storage/framework/cache \
    /app/storage/framework/sessions \
    /app/storage/framework/views \
    /app/bootstrap/cache

# Set permissions
RUN chmod -R 775 /app/storage /app/bootstrap/cache

# Create non-root user
RUN addgroup -g 1000 laravel && \
    adduser -D -u 1000 -G laravel laravel

# Change ownership
RUN chown -R laravel:laravel /app

USER laravel

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/healthz || exit 1

# Start application
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
