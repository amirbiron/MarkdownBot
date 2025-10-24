#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║  Markdown Trainer Bot - Setup Script  ║"
echo "╔═══════════════════════════════════════╗"
echo -e "${NC}"

# Check if Node.js is installed
echo -e "${BLUE}[1/5] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} found${NC}"

# Check if npm is installed
echo -e "${BLUE}[2/5] Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm ${NPM_VERSION} found${NC}"

# Install dependencies
echo -e "${BLUE}[3/5] Installing dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
echo -e "${BLUE}[4/5] Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your TELEGRAM_BOT_TOKEN${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Create necessary directories
echo -e "${BLUE}[5/5] Creating necessary directories...${NC}"
mkdir -p database
mkdir -p output
echo -e "${GREEN}✅ Directories created${NC}"

# Final instructions
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎉 Setup Complete!                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit .env file and add your TELEGRAM_BOT_TOKEN"
echo "   Get your token from: https://t.me/botfather"
echo ""
echo "2. Run the bot:"
echo "   ${GREEN}npm start${NC}        # Production mode"
echo "   ${GREEN}npm run dev${NC}      # Development mode (with auto-restart)"
echo ""
echo -e "${BLUE}Need help? Check the README.md file${NC}"
echo ""
