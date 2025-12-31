#!/bin/bash
# Build script for Render

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Installing Node.js dependencies..."
npm install

echo "Building frontend..."
cd client/vite-project
npm install
npm run build
cd ../..

echo "Build complete!"
