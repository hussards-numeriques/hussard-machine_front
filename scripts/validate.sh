#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Running all validation checks..."
echo ""

echo "ESLint (linting)..."
npm run lint

echo ""
echo "Prettier (formatting check)..."
npx prettier --check .

echo ""
echo "TypeScript (type checking)..."
npx tsc --noEmit

echo ""
echo "Vitest (tests)..."
npm run test

echo ""
echo "All validation checks passed!"
