#!/bin/bash

# CHEFAA CLONE - QUICK START SCRIPT
# This script automates the setup process
# Usage: bash QUICK_START.sh

set -e  # Exit on any error

echo "====================================================="
echo "  🚀 CHEFAA CLONE - QUICK START"
echo "====================================================="
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed!"
    echo "   Installing pnpm globally..."
    npm install -g pnpm
fi

echo "✅ pnpm found: $(pnpm --version)"

# Check if Node.js version is acceptable
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher"
    echo "   Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"
echo ""

# Step 1: Clean
echo "🧹 Step 1: Cleaning previous installation..."
pnpm clean 2>/dev/null || true
pnpm store prune 2>/dev/null || true
echo "✅ Clean complete"
echo ""

# Step 2: Install
echo "📋 Step 2: Installing dependencies..."
echo "   This may take 3-5 minutes on first run..."
pnpm install --prefer-offline
echo "✅ Installation complete"
echo ""

# Step 3: Verify
echo "🔍 Step 3: Verifying installation..."
echo "   Checking packages..."
pnpm ls --depth=0 > /dev/null 2>&1 && echo "✅ Packages verified" || echo "❌ Package verification failed"
echo ""

# Step 4: Build
echo "🔨 Step 4: Building project..."
echo "   This may take 30-60 seconds..."
pnpm run build > /dev/null 2>&1 && echo "✅ Build successful" || echo "❌ Build failed"
echo ""

# Step 5: Ready
echo "====================================================="
echo "  ✅ SETUP COMPLETE!"
echo "====================================================="
echo ""
echo "To start the development server, run:"
echo "  🎦 pnpm run dev"
echo ""
echo "The app will open at: http://localhost:5173"
echo ""
echo "For other commands, see FIXES_AND_SETUP.md"
echo ""
