#!/bin/bash

echo "🚀 Iniciando despliegue remoto de cart-service en $EC2_IP"

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
PORT=${APP_PORT}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
SECRET_JWT=${SECRET_JWT}
DB_DATABASE=${DB_DATABASE}
DB_NAME=${DB_NAME}
ENV

  echo "📦 Limpiando node_modules e instalando dependencias"
  rm -rf node_modules
  npm ci

  echo "🏗️ Compilando TypeScript"
  npm run build

  echo "🚦 Reiniciando servidor con PM2"
  pm2 delete "\$APP_NAME" || true
  pm2 start dist/main.js --name "\$APP_NAME" --env "\$NODE_ENV"

  echo "✅ Despliegue de cart-service completado en \$NODE_ENV"
EOF
