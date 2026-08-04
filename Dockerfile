# ==============================================================================
# Dockerfile: Servicio de Guía Web Estática (Nginx)
# Despliegue en Coolify / Docker
# ==============================================================================

FROM nginx:1.25-alpine

LABEL maintainer="SENA ADSO <desarrollo@sena.edu.co>"
LABEL description="Servidor Nginx ultraligero para la Guía Web"

# Limpiar directorio web predeterminado
RUN rm -rf /usr/share/nginx/html/*

# Copiar contenido estático del sitio web
COPY . /usr/share/nginx/html/

# Permisos de lectura
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
