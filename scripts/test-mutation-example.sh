#!/bin/bash
# Example script demonstrating manual mutation testing
# This shows how to verify your tests catch real bugs

set -e

echo "🧪 Manual Mutation Testing Example"
echo ""
echo "This script demonstrates how to verify your tests actually catch bugs."
echo ""

# Step 1: Run tests - should pass
echo "Step 1: Running tests (should pass)..."
npm run test:ci || {
  echo "❌ Tests are already failing! Fix them first."
  exit 1
}
echo "✅ Tests pass"
echo ""

# Step 2: Show example mutation
echo "Step 2: Example mutation to try manually:"
echo ""
echo "In lib/claude/client.ts, find:"
echo "  if (error.status === 401 || error.status === 403) {"
echo ""
echo "Change it to:"
echo "  if (error.status === 401 && error.status === 403) {"
echo ""
echo "This creates a bug (condition can never be true)."
echo ""

# Step 3: Instructions
echo "Step 3: After making the mutation:"
echo "  - Run: npm run test:ci"
echo "  - If tests still pass → your tests are too weak"
echo "  - If tests fail → your tests are catching bugs ✅"
echo ""
echo "Step 4: Revert the mutation and commit your tests."
echo ""
echo "💡 Tip: Try different mutations:"
echo "  - Change === to !== or == "
echo "  - Change && to || or vice versa"
echo "  - Remove error handling blocks"
echo "  - Change return values"
echo "  - Remove null/undefined checks"
echo ""

