#!/usr/bin/env bash
set -e

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Installing Node.js dependencies..."
npm install

echo "Building frontend..."
cd client/vite-project
npm install --include=dev
npm run build

echo "Build complete!"
