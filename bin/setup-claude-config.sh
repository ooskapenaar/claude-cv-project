#!/bin/bash

# Setup Claude Desktop configuration with dynamic paths
# This replaces hardcoded paths with the actual project location

set -e

# Get the absolute path of the project root (parent of bin directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="$PROJECT_ROOT/conf/claude_desktop_config.template.json"
OUTPUT_FILE="$PROJECT_ROOT/conf/claude_desktop_config.json"
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

echo "🔧 Setting up Claude Desktop configuration..."
echo "📁 Project root: $PROJECT_ROOT"

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Replace placeholder with actual project root
echo "📝 Generating config from template..."
sed "s|{{PROJECT_ROOT}}|$PROJECT_ROOT|g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "✅ Generated: $OUTPUT_FILE"

# Optionally install to Claude Desktop
if [ "$1" == "--install" ]; then
    echo "📦 Installing to Claude Desktop..."
    mkdir -p "$CLAUDE_CONFIG_DIR"
    cp "$OUTPUT_FILE" "$CLAUDE_CONFIG_FILE"
    echo "✅ Installed: $CLAUDE_CONFIG_FILE"
    echo "🔄 Please restart Claude Desktop to load the new configuration"
else
    echo "💡 To install to Claude Desktop, run:"
    echo "   $0 --install"
    echo "   or manually copy to: $CLAUDE_CONFIG_FILE"
fi

echo "🎉 Setup complete!"