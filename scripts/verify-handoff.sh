#!/usr/bin/env bash
set -euo pipefail

echo "========================================="
echo "  Handoff Verification Report"
echo "========================================="
echo ""

# Step 1: Build check
echo "[1/4] Running build verification..."
if npm run build --silent 2>/dev/null; then
  echo "  PASS: Build succeeded"
else
  echo "  FAIL: Build failed"
  exit 1
fi
echo ""

# Step 2: Count mock imports in pages vs data hooks
echo "[2/4] Mock import audit..."
PAGE_MOCKS=$(grep -rn "from.*mock" src/modules/*/pages/ src/modules/*/components/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "import type" | grep -v "node_modules" | grep -v ".test." | wc -l | tr -d ' ')
HOOK_MOCKS=$(grep -rn "from.*mock" src/modules/*/api/ --include="*.ts" 2>/dev/null | grep -v "import type" | grep -v "node_modules" | wc -l | tr -d ' ')
STORE_MOCKS=$(grep -rn "from.*mock" src/modules/*/stores/ --include="*.ts" 2>/dev/null | grep -v "import type" | grep -v "node_modules" | wc -l | tr -d ' ')

echo "  Mock value imports in pages/components: $PAGE_MOCKS"
echo "  Mock value imports in data hooks (api/): $HOOK_MOCKS"
echo "  Mock value imports in stores: $STORE_MOCKS"
echo ""

# Step 3: Check data hook coverage
echo "[3/4] Data hook coverage..."
for module in src/modules/*/; do
  module_name=$(basename "$module")
  has_mock=$(ls "$module"data/mock*.ts 2>/dev/null | wc -l | tr -d ' ')
  has_hook=$(ls "$module"api/use*Data.ts 2>/dev/null | wc -l | tr -d ' ')
  if [ "$has_mock" -gt 0 ]; then
    if [ "$has_hook" -gt 0 ]; then
      echo "  $module_name: $has_mock mock file(s), $has_hook data hook(s)"
    else
      echo "  $module_name: $has_mock mock file(s), NO data hooks yet"
    fi
  fi
done
echo ""

# Step 4: Summary
echo "[4/4] Summary"
TOTAL_MOCKS=$((PAGE_MOCKS + STORE_MOCKS))
echo "  Direct mock imports (pages + stores): $TOTAL_MOCKS"
echo "  Migrated to hooks (api/): $HOOK_MOCKS"
echo ""

if [ "$TOTAL_MOCKS" -eq 0 ]; then
  echo "  STATUS: All mock imports migrated!"
else
  echo "  STATUS: $TOTAL_MOCKS imports still need migration"
fi
echo ""
echo "========================================="
