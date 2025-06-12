#!/bin/bash

echo "🚀 Iniciando despliegue remoto de api-gateway en $EC2_IP"

# Validar variables locales
if [ -z "$EC2_IP" ] || [ -z "$EC2_USER" ] || [ -z "$SSH_KEY" ] || [ -z "$REPO_URL" ] || [ -z "$GIT_BRANCH" ] || [ -z "$NODE_ENV" ]; then
  echo "❌ Faltan variables de entorno. Asegúrate de definir EC2_IP, EC2_USER, SSH_KEY, REPO_URL, GIT_BRANCH y NODE_ENV."
  exit 1
fi

REMOTE_PATH="$REMOTE_PATH" # This comes from Jenkinsfile now
APP_NAME="$APP_NAME"       # This comes from Jenkinsfile now

echo "🌐 Conectando a la instancia EC2: $EC2_IP"
echo "➡️ Conectando a $EC2_USER@$EC2_IP"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" bash -s << EOF
  set -e

  export NODE_ENV="$NODE_ENV"
  export APP_NAME="$APP_NAME"

  echo "📁 Creando/entrando a carpeta del proyecto: $REMOTE_PATH"
  mkdir -p "$REMOTE_PATH"
  cd "$REMOTE_PATH"

  # Navigate to the monorepo root for git operations
  MONOREPO_ROOT=$(dirname $(dirname "$REMOTE_PATH"))
  cd "$MONOREPO_ROOT"

  if [ ! -d ".git" ]; then
    echo "🌀 Clonando repositorio"
    git clone -b "$GIT_BRANCH" "$REPO_URL" .
  else
    echo "🔄 Haciendo pull del código"
    git fetch origin
    git checkout "$GIT_BRANCH"
    git pull origin "$GIT_BRANCH"
  fi

  # Navigate back to the specific microservice directory
  cd "$REMOTE_PATH"

  echo "⚙️ Ejecutando setup EC2 (deploy-utils)"
  chmod +x ../../scripts/deploy-utils.sh
  ../../scripts/deploy-utils.sh

  echo "🔧 Creando archivo .env con variables de entorno"
  cat > .env << ENV
# --- Aplicación Gateway ---
NODE_ENV=${NODE_ENV}
GATEWAY_PORT=${GATEWAY_PORT}

# --- JWT (para validar tokens de clientes) ---
JWT_SECRET=${SECRET_JWT}
JWT_EXPIRATION_TIME=${JWT_EXPIRATION_TIME}

# --- URLs de los Microservicios Internos (ajusta puertos según tu configuración) ---
USER_SERVICE_URL=${USER_SERVICE_URL}
USER_SERVICE_BASE_PATH=${USER_SERVICE_BASE_PATH}
PRODUCT_SERVICE_URL=${PRODUCT_SERVICE_URL}
PRODUCT_SERVICE_BASE_PATH=${PRODUCT_SERVICE_BASE_PATH}
CART_SERVICE_URL=${CART_SERVICE_URL}
CART_SERVICE_BASE_PATH=${CART_SERVICE_BASE_PATH}
STOCK_SERVICE_URL=${STOCK_SERVICE_URL}
STOCK_SERVICE_BASE_PATH=${STOCK_SERVICE_BASE_PATH}
ORDER_SERVICE_URL=${ORDER_SERVICE_URL}
ORDER_SERVICE_BASE_PATH=${ORDER_SERVICE_BASE_PATH}

# --- API Keys que el Gateway usará para llamar a los Microservicios ---
USER_SERVICE_API_KEY=${USER_SERVICE_API_KEY}
PRODUCT_SERVICE_API_KEY=${PRODUCT_SERVICE_API_KEY}
CART_SERVICE_API_KEY=${CART_SERVICE_API_KEY}
STOCK_SERVICE_API_KEY=${STOCK_SERVICE_API_KEY}
ORDER_SERVICE_API_KEY=${ORDER_SERVICE_API_KEY}

# --- Swagger (para la documentación del API Gateway) ---
SWAGGER_GATEWAY_SERVER_URL=${SWAGGER_GATEWAY_SERVER_URL}

# --- Configuración HTTPModule (timeouts para llamadas a microservicios) ---
HTTP_TIMEOUT=${HTTP_TIMEOUT}
HTTP_MAX_REDIRECTS=${HTTP_MAX_REDIRECTS}
ENV

  echo "📦 Limpiando node_modules e instalando dependencias"
  rm -rf node_modules
  npm ci

  echo "🏗️ Compilando TypeScript"
  npm run build

  echo "🚦 Reiniciando servidor con PM2"
  pm2 delete "\$APP_NAME" || true
  pm2 start dist/main.js --name "\$APP_NAME" --env "\$NODE_ENV"

  echo "✅ Despliegue de api-gateway completado en \$NODE_ENV"
EOF
