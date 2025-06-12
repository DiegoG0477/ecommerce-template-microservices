#!/bin/bash

echo "Running deploy-utils.sh for basic setup..."

# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null
then
    echo "Node.js not found, installing..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null
then
    echo "PM2 not found, installing..."
    npm install pm2 -g
fi

echo "deploy-utils.sh finished."
