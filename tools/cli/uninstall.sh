#!/bin/bash

# uninstall.sh - Uninstall shapes-cli global command
# Usage: ./uninstall.sh

set -e

echo "🗑️  Uninstalling shapes-cli global command..."

# Check if package is linked
if ! npm list -g @shapesinc/cli &>/dev/null; then
    echo "⚠️  Package is not currently linked globally."
    echo "   Nothing to uninstall."
    exit 0
fi

echo "🔗 Unlinking package globally..."
npm unlink -g @shapesinc/cli

# Verify removal
if ! command -v shapes-cli &> /dev/null; then
    echo "✅ SUCCESS: shapes-cli global command has been removed!"
    echo ""
    echo "💡 To reinstall, run: ./install.sh"
else
    echo "❌ WARNING: shapes-cli command still exists after unlinking."
    echo "   This might be due to caching or multiple installations."
    echo "   Try restarting your terminal or checking for other npm installations."
fi

echo ""
echo "📁 Note: Local configuration files in ~/.shapes-cli/ are preserved."
echo "   These contain your API keys, tokens, and settings."