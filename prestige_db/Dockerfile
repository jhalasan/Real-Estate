# Use the official PHP image with Apache
FROM php:8.3.6

# Enable PDO PostgreSQL extension
RUN docker-php-ext-install pdo pdo_pgsql

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY . .

# Expose the port Render uses
EXPOSE 10000

# Start Apache in the foreground
CMD ["apache2-foreground"]
