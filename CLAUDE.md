# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tampermonkey userscript that optimizes stock ordering for companies in Torn City (torn.com). The script:
- Scrapes current stock data from the company management page DOM
- Calculates days of stock remaining for each item
- Uses binary search to find optimal order quantities that maximize warehouse utilization
- Auto-fills order forms with recommended quantities

## Architecture

### Single-File Userscript Structure

All code lives in `stock-optimizer.user.js` with these functional layers:

1. **DOM Scraping** (lines 33-92): Extract warehouse capacity, current stock, on-order quantities, and daily sales from page elements
2. **Optimization Algorithm** (lines 94-169): Core binary search algorithm that equalizes days-of-stock across all items while respecting warehouse capacity constraints
3. **Form Population** (lines 171-204): Locate and fill order input fields using aria-labels
4. **UI Integration** (lines 255-346): Inject "OPTIMIZE" button into Torn's existing UI and handle AJAX page reloads

### Key Algorithm: `computeOptimalOrder()`

Binary search over target days-of-stock (0-3650 days range, 40 iterations). For each candidate target:
- Calculate units needed to bring all items to that target
- If total exceeds warehouse capacity, reduce target; otherwise increase
- Converges on the maximum achievable uniform stock level
- Distributes any remaining capacity to highest-selling items

## Development Commands

**Test the script:**
- Install in Tampermonkey
- Navigate to `https://www.torn.com/companies.php` (requires Torn account with company access)
- Click "OPTIMIZE" button next to "PLACE ORDER"

**Debug:**
- Open browser console to see detailed logs prefixed with emoji indicators (📦, ✅, ❌, ⚠️)
- Call `window.StockOptimizer.scrapeStockData()` in console to test data extraction
- Call `window.StockOptimizer.getWarehouseCapacity()` to verify capacity detection

## Critical Implementation Details

### DOM Dependencies

The script relies on Torn's specific HTML structure:
- `.storage-capacity .max` for warehouse capacity
- `.stock-list li` for item listings with `.name`, `.stock`, `.sold-daily` classes
- `.order-list li` for pending orders
- `input[aria-label="${itemName}"][type="text"].input-money` for order fields
- `span.order.btn-wrap.silver` as button injection point

**If Torn changes their DOM structure, these selectors will break.**

### Page State Management

Torn uses AJAX for navigation without full page reloads. The script handles this with:
- MutationObserver watching for DOM changes (lines 335-342)
- Fallback interval checking every 2s (line 345)
- Button existence check to prevent duplicates (line 258)

### Input Field Population

Must dispatch both `input` and `change` events (lines 187-188) for Torn's JavaScript to recognize the values. Simple `.value` assignment isn't sufficient.

## Testing Scenarios

**Normal case:** Multiple items with varying stock levels and sales rates
**Edge cases:**
- Item with 0 daily sales (infinite days-of-stock) - skipped in optimization
- Warehouse at full capacity (freeCapacity = 0) - returns empty orders
- No items on page - throws error with helpful message
- Warehouse capacity not detected - falls back to 500,000 default

## Code Modification Guidelines

**When changing the optimization algorithm:**
- Maintain the binary search bounds (0.0 to 3650.0 days)
- Keep iteration count at 40 for convergence stability
- Test with extreme cases: single item, all items sold equally, warehouse nearly full

**When updating DOM scraping:**
- Verify against current Torn page structure in browser inspector
- Update both scraping AND field population if element structure changes
- Add console logging for debugging selector failures

**When modifying UI:**
- Match Torn's button styling (`.btn-wrap.silver`, `.torn-btn` classes)
- Maintain button state management (processing, success, error states)
- Test with Torn's AJAX navigation (clicking between company tabs)

## Deployment

1. Update version in Tampermonkey metadata (line 4)
2. Users install/update via Tampermonkey dashboard
3. No build step or dependencies required - pure vanilla JavaScript
