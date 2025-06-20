# Multi-stage build for Wolthers & Associates Website
FROM nginx:alpine as production

# Install PHP-FPM for backend processing
RUN apk add --no-cache php81-fpm php81-mysqli php81-json php81-session php81-curl

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy main site files
COPY main\ site\ reference /usr/share/nginx/html/

# Copy trips application
COPY public /usr/share/nginx/html/trips/

# Create trips directory structure
RUN mkdir -p /usr/share/nginx/html/trips/database \
    && mkdir -p /usr/share/nginx/html/trips/api \
    && chown -R nginx:nginx /usr/share/nginx/html

# Copy database initialization scripts
COPY database/init.sql /docker-entrypoint-initdb.d/

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 