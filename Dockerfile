# ===== Stage 1: Build =====
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias del sistema (si necesitas openssl para generar claves)
RUN apk add --no-cache openssl

# Copiar package.json y lock primero para aprovechar caché
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm install --production=false

# Copiar código fuente
COPY src ./src

# Compilar a JavaScript
RUN npx tsc

# ===== Stage 2: Production =====
FROM node:20-alpine
WORKDIR /app

# Instalar dependencias del sistema necesarias en runtime
RUN apk add --no-cache openssl

# Copiar package.json y lock
COPY package*.json ./

# Instalar solo dependencias necesarias en producción
RUN npm install --production

# Copiar el build compilado desde la imagen anterior
COPY --from=builder /app/dist ./dist

# Copiar claves si decides guardarlas en la imagen (NO recomendado para prod)
# COPY keys ./keys

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/index.js"]
