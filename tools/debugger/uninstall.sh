#!/bin/bash

# uninstall.sh - Uninstall shapes-debug global command
# Usage: ./uninstall.sh

set -e

echo "🗑️  Uninstalling shapes-debug global command..."

# Check if package is linked
if ! npm list -g @shapesinc/debugger &>/dev/null; then
    echo "⚠️  Package is not currently linked globally."
    echo "   Nothing to uninstall."
    exit 0
fi

echo "🔗 Unlinking package globally..."
npm unlink -g @shapesinc/debugger

# Verify removal
if ! command -v shapes-debug &> /dev/null; then
    echo "✅ SUCCESS: shapes-debug global command has been removed!"
    echo ""
    echo "💡 To reinstall, run: ./install.sh"
else
    echo "❌ WARNING: shapes-debug command still exists after unlinking."
    echo "   This might be due to caching or multiple installations."
    echo "   Try restarting your terminal or checking for other npm installations."
fi

echo ""
echo "📁 Note: Local configuration files in ~/.shapes-debug/ are preserved."
echo "   These contain your API keys, tokens, and settings."