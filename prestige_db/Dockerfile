# Use the official PHP image with Apache
FROM php:8.3.6-apache

# Install PostgreSQL client libraries and other build tools
RUN apt-get update && \
    apt-get install -y libpq-dev gcc make autoconf && \
    docker-php-ext-install pdo pdo_pgsql && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY . .

# Expose the port Render uses
EXPOSE 10000

# Start Apache in the foreground
CMD ["apache2-foreground"]

# Copy public folder to Apache web root
COPY public/ /var/www/html/

# Copy other code somewhere else (optional)
COPY src/ /var/www/src/
COPY config/ /var/www/config/
