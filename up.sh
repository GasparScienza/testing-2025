#!/bin/bash
# docker compose --env-file .env.docker up -d
#!/bin/bash

# Reconstruir sin cache
docker compose build --no-cache

# Levantar en modo detached usando el archivo de entorno
docker compose --env-file .env.docker up -d
