FROM node:22-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json prisma ./  

# Instala dependencias solo para compilación
RUN npm install

RUN apk add --no-cache openssl ca-certificates curl

# Test conexión (opcional, para debug)
RUN curl -I https://binaries.prisma.sh || echo "Prisma binaries not reachable"

RUN npx prisma generate

# Genera el cliente Prisma
RUN npx prisma generate

# Copia el resto de la aplicación
COPY . .

# Compila la aplicación NestJS
RUN npm run build

RUN npm prune --omit=dev

# Etapa 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Copia solo los archivos necesarios desde el build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Si usas migraciones en producción, puedes copiar el schema también:
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env .env

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
