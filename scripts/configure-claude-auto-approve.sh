#!/bin/bash

# Script to configure Claude Code for autonomous command execution
# This disables approval prompts for dangerous commands

set -e

echo "🔧 Configuring Claude Code for autonomous execution..."
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Darwin*)
        VSCODE_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"
        ;;
    Linux*)
        VSCODE_SETTINGS="$HOME/.config/Code/User/settings.json"
        ;;
    *)
        echo "❌ Unsupported OS: ${OS}"
        exit 1
        ;;
esac

echo "📁 VS Code settings location: $VSCODE_SETTINGS"
echo ""

# Check if settings file exists
if [ ! -f "$VSCODE_SETTINGS" ]; then
    echo "⚠️  Settings file not found. Creating new one..."
    mkdir -p "$(dirname "$VSCODE_SETTINGS")"
    echo "{}" > "$VSCODE_SETTINGS"
fi

# Backup existing settings
BACKUP_FILE="${VSCODE_SETTINGS}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$VSCODE_SETTINGS" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Read current settings
CURRENT_SETTINGS=$(cat "$VSCODE_SETTINGS")

# Check if Claude settings already exist
if echo "$CURRENT_SETTINGS" | grep -q '"claude.defaultMode"'; then
    echo "⚠️  Claude Code settings already exist. Updating..."
else
    echo "➕ Adding Claude Code settings..."
fi

# Create the new settings using Node.js for proper JSON manipulation
node -e "
const fs = require('fs');
const settingsPath = '$VSCODE_SETTINGS';
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

// Add Claude Code settings
settings['claude.defaultMode'] = 'bypassPermissions';
settings['claude.autoAllowBashIfSandboxed'] = true;
settings['claude.permissions'] = {
  allow: [
    'Bash(pnpm:*)',
    'Bash(npm:*)',
    'Bash(node:*)',
    'Bash(git:*)',
    'Bash(psql:*)',
    'Bash(PGPASSWORD:*)',
    'Bash(export:*)',
    'Bash(cd:*)',
    'Bash(ls:*)',
    'Bash(mkdir:*)',
    'Bash(chmod:*)',
    'Bash(supabase:*)',
    'SlashCommand:*',
    'Read:*',
    'Write:*',
    'Edit:*'
  ]
};

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
console.log('✅ Settings updated successfully!');
"

echo ""
echo "✨ Configuration complete!"
echo ""
echo "📋 Applied settings:"
echo "   - Default Mode: bypassPermissions"
echo "   - Auto Allow Bash If Sandboxed: true"
echo "   - Pre-approved command patterns added"
echo ""
echo "⚠️  IMPORTANT: Restart VS Code for changes to take effect"
echo ""
echo "🔄 To restore previous settings, use:"
echo "   cp \"$BACKUP_FILE\" \"$VSCODE_SETTINGS\""
echo ""
