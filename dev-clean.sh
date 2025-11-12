#!/bin/bash

# Development Environment Cleanup Script
# Fixes common Next.js + pnpm development issues

set -e  # Exit on error

echo "🧹 Development Environment Cleanup"
echo "=================================="
echo ""

# Function to ask for confirmation
confirm() {
    read -p "$1 [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# 1. Kill all Next.js processes
echo "📍 Step 1/5: Killing Next.js processes..."
pkill -f "next dev" 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
echo "✓ Processes killed"
echo ""

# 2. Clean build artifacts
echo "📍 Step 2/5: Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules
rm -f .pnpm-debug.log* 2>/dev/null || true
echo "✓ Build artifacts cleaned"
echo ""

# 3. Clean pnpm store (optional, asks for confirmation)
if confirm "🤔 Clean pnpm global store? (frees space but slower next install)"; then
    echo "📍 Step 3/5: Cleaning pnpm store..."
    pnpm store prune
    echo "✓ Store pruned"
else
    echo "⊘ Step 3/5: Skipped pnpm store cleanup"
fi
echo ""

# 4. Reinstall dependencies
echo "📍 Step 4/5: Reinstalling dependencies..."
pnpm install --force --no-frozen-lockfile
echo "✓ Dependencies installed"
echo ""

# 5. Start dev server
echo "📍 Step 5/5: Starting dev server..."
echo "📄 Loading environment from .env.local"
echo ""

# Start with clean Stripe environment variables
env -u STRIPE_SECRET_KEY \
    -u NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    -u STRIPE_CONNECT_CLIENT_ID \
    -u STRIPE_WEBHOOK_SECRET \
    pnpm dev
