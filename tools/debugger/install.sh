#!/bin/bash

# install.sh - Install shapes-debug as a global command
# Usage: ./install.sh

set -e

echo "🔧 Installing shapes-debug as a global command..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the CLI directory."
    exit 1
fi

# Check if already linked
if npm list -g @shapesinc/debugger &>/dev/null; then
    echo "⚠️  Package is already linked globally."
    echo "   Use ./uninstall.sh first if you want to reinstall."
    exit 0
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "🧹 Running lint check..."
npm run lint

echo "🔍 Running type check..."
npm run typecheck

echo "🔗 Linking package globally..."
npm link

# Check if shapes-debug command is available
echo "✅ Testing global command..."
if command -v shapes-debug &> /dev/null; then
    echo "✅ SUCCESS: shapes-debug is now available as a global command!"
    echo ""
    echo "🚀 You can now run 'shapes-debug' from anywhere!"
    echo "   Try: shapes-debug"
    echo ""
    echo "💡 To uninstall, run: ./uninstall.sh"
else
    echo "❌ ERROR: shapes-debug command not found after linking."
    echo "   This might be a PATH issue. Try:"
    echo "   - Restart your terminal"
    echo "   - Check your NODE_PATH and npm global bin directory"
    exit 1
fi