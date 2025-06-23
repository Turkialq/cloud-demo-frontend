# WebSocket Chat Frontend

A Discord-themed real-time chat application built with React, TypeScript, and Vite.

## Features

- Discord-like dark theme UI
- Real-time messaging via WebSockets
- Username-based chat (no authentication)
- User join/leave notifications
- Active users list
- Responsive design

## Requirements

- Node.js 18+ and npm

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp env.example .env

# Update .env with your backend URL if needed
# VITE_WS_URL=ws://localhost:5050/ws

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

### AWS VM Deployment

```bash
# Clone the repository
git clone <your-repo-url>
cd frontend

# Make deploy script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh

# Edit .env file to point to your backend server
nano .env
# Update VITE_WS_URL=ws://YOUR_BACKEND_IP:5050/ws
```

## Configuration

- WebSocket URL: Configure in `.env` file
- Default port: 3000 (production), 5173 (development)

## Building for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Environment Variables

- `VITE_WS_URL`: WebSocket server URL (e.g., `ws://backend-server:5050/ws`)
