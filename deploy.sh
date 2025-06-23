#!/bin/bash

# Frontend deployment script for AWS VM

echo "🚀 Deploying Frontend..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install git if not installed
if ! command -v git &> /dev/null; then
    echo "📥 Installing Git..."
    sudo apt install -y git
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    echo "Please update VITE_WS_URL with your backend server URL"
    cp env.example .env
fi

# Build for production
echo "🔨 Building for production..."
npm run build

# Install serve globally if not installed
if ! command -v serve &> /dev/null; then
    echo "📥 Installing serve..."
    sudo npm install -g serve
fi

# Start the server
echo "✅ Starting frontend server on port 3000..."
echo "Press Ctrl+C to stop the server"
serve -s dist -l 3000