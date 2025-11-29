#!/bin/bash

# EMERGENCY SCROLL FIX - AUTO COPY SCRIPT
# Run this from your project root directory

echo "🚨 EMERGENCY SCROLL FIX"
echo "======================="
echo ""

# Check if we're in the right directory
if [ ! -d "app" ]; then
  echo "❌ Error: 'app' directory not found."
  echo "Please run this script from your project root directory."
  exit 1
fi

echo "✅ Found project structure"
echo ""

# Backup existing files
echo "📦 Creating backups..."
cp app/globals.css app/globals.css.backup 2>/dev/null && echo "  ✓ Backed up globals.css"
cp public/manifest.json public/manifest.json.backup 2>/dev/null && echo "  ✓ Backed up manifest.json"
cp app/layout.tsx app/layout.tsx.backup 2>/dev/null && echo "  ✓ Backed up layout.tsx"
echo ""

# Prompt for download location
echo "📥 Where did you download the fixed files?"
echo "Paste the full path to your Downloads folder (e.g., /Users/jay/Downloads):"
read DOWNLOAD_PATH

# Verify files exist
if [ ! -f "$DOWNLOAD_PATH/globals.css" ]; then
  echo "❌ Error: globals.css not found in $DOWNLOAD_PATH"
  exit 1
fi

echo ""
echo "📝 Copying fixed files..."

# Copy files
cp "$DOWNLOAD_PATH/globals.css" app/globals.css && echo "  ✓ Copied globals.css"
cp "$DOWNLOAD_PATH/manifest.json" public/manifest.json && echo "  ✓ Copied manifest.json"
cp "$DOWNLOAD_PATH/layout.tsx" app/layout.tsx && echo "  ✓ Copied layout.tsx"

echo ""
echo "✅ All files copied successfully!"
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Deploy: git add . && git commit -m 'fix: restore scrolling' && git push"
echo ""
echo "🚀 You're all set!"
