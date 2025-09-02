#!/bin/bash

# CV Project - Claude Desktop Setup Script
# This script configures Claude Desktop to work with the CV optimization MCP services

set -e

PROJECT_ROOT="/Users/rrrw/Projects/ML/CV_Project"
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

echo "🚀 Setting up Claude Desktop for CV Project"
echo "=================================================="

# Check if project exists
if [ ! -d "$PROJECT_ROOT" ]; then
    echo "❌ Error: Project directory not found at $PROJECT_ROOT"
    exit 1
fi

# Build all MCP services
echo "🔨 Building MCP services..."

echo "  Building filesystem-mcp..."
cd "$PROJECT_ROOT/src/filesystem-mcp"
npm run build

echo "  Building matrix-analysis-mcp..."
cd "$PROJECT_ROOT/src/matrix-analysis-mcp" 
npm run build

echo "  Building cv-generation-mcp..."
cd "$PROJECT_ROOT/src/cv-generation-mcp"
npm run build

# Create Claude config directory if it doesn't exist
echo "📁 Creating Claude Desktop configuration directory..."
mkdir -p "$CLAUDE_CONFIG_DIR"

# Backup existing config if it exists
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "💾 Backing up existing Claude Desktop configuration..."
    cp "$CLAUDE_CONFIG_FILE" "${CLAUDE_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy new configuration
echo "⚙️  Installing CV Project MCP configuration..."
cp "$PROJECT_ROOT/conf/claude_desktop_config.json" "$CLAUDE_CONFIG_FILE"

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop application"
echo "2. In Claude Desktop, type: 'list available tools'"
echo "3. You should see tools from all three MCP services"
echo "4. Try one of the workflow templates from:"
echo "   $PROJECT_ROOT/conf/workflow-templates.md"
echo ""
echo "🎯 Recommended first prompt:"
echo "   'I want to analyze my collected job opportunities. Please list all available jobs with numbers for selection.'"
echo ""
echo "📚 For detailed workflows, see: $PROJECT_ROOT/conf/workflow-templates.md"