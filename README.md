# Torn Stock Optimizer

Automatically optimize your company stock orders in Torn City with a single click.

## What It Does

This Tampermonkey userscript analyzes your company's current inventory and sales data to calculate the optimal order quantities for all items. It uses a smart algorithm to:

- Balance stock levels across all items
- Maximize warehouse space utilization
- Prioritize items based on sales velocity
- Account for items already on order

The result: efficient inventory management that keeps your shelves stocked without wasting warehouse capacity.

## Installation

### Prerequisites

1. **A userscript manager** - Install one of these browser extensions:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge, Opera)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox only)

### Install the Script

**Option 1: Direct Install**
1. Click on `stock-optimizer.user.js` in this repository
2. Click the "Raw" button
3. Your userscript manager should prompt you to install it

**Option 2: Manual Install**
1. Copy the contents of `stock-optimizer.user.js`
2. Open your userscript manager dashboard
3. Create a new script
4. Paste the code and save

## Usage

1. Navigate to your company management page: `https://www.torn.com/companies.php`
2. Go to the stock ordering section (where you normally place orders)
3. Look for the purple **"OPTIMIZE"** button next to the "PLACE ORDER" button
4. Click **"OPTIMIZE"** to automatically calculate and fill in optimal order quantities
5. Review the suggested orders (check your browser console for detailed breakdown)
6. Click **"PLACE ORDER"** to submit the orders to Torn

### Console Output

Open your browser's developer console (F12) to see detailed information:

```
📦 Warehouse capacity: 500,000
✅ Scraped data for 12 items

=== Stock Optimization Results ===

📊 Current Stock Metrics:
  Feathery Hotel Bed: 450 stock, 150 sold, 3.0 days
  Ergonomic Keyboard: 800 stock, 200 sold, 4.0 days
  ...

📦 Warehouse: 125,000/500,000 (375,000 free)

✅ Recommended Orders:
  Feathery Hotel Bed: 5,250 units
  Ergonomic Keyboard: 3,200 units
  ...

✅ Populated 12 order fields
```

## How It Works

The optimizer uses a binary search algorithm to find the maximum "days of stock" target that fits within your available warehouse space. It:

1. **Scrapes your current data** from the page:
   - Items in stock
   - Items on order (not yet delivered)
   - Daily sales per item
   - Warehouse capacity

2. **Calculates optimal target** using binary search:
   - Tries to equalize stock levels across all items (measured in days)
   - Respects warehouse capacity constraints
   - Skips items with zero sales

3. **Distributes remaining space** to highest-selling items if any capacity is left

4. **Auto-fills the order forms** with calculated quantities

## Features

- ✅ **Zero configuration** - Works out of the box
- ✅ **Automatic warehouse detection** - Reads your actual capacity from the page
- ✅ **Accounts for pending orders** - Includes items already on order in calculations
- ✅ **Smart prioritization** - Focuses on fast-moving inventory
- ✅ **Visual feedback** - Button states show processing, success, and errors
- ✅ **Detailed logging** - Console output explains all decisions
- ✅ **AJAX-aware** - Works with Torn's dynamic page updates

## Compatibility

- **Tested on**: Chrome, Firefox
- **Torn pages**: Works on `https://www.torn.com/companies.php`
- **Requires**: Active company membership with stock ordering permissions

## Troubleshooting

**Button doesn't appear:**
- Make sure you're on the company stock ordering page
- Wait a few seconds for Torn's AJAX to load
- Check that your userscript manager is enabled
- Verify the script is installed and active

**"No items found" error:**
- Ensure you're on the correct page (stock ordering section)
- Check that your company has items to order
- Verify the page has fully loaded

**Orders seem incorrect:**
- Check console output for detailed calculations
- Verify your warehouse capacity is detected correctly
- Ensure sales data is up-to-date on the page

**Warehouse capacity wrong:**
- Script reads capacity from page - if not found, defaults to 500,000
- Check console for "Warehouse capacity" message
- If incorrect, report as a bug

## Development

See [CLAUDE.md](CLAUDE.md) for technical documentation and development guidelines.

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Disclaimer

This is a client-side automation tool that reads and interacts with Torn's web interface. It does not:
- Access Torn's API
- Modify game data directly
- Violate Torn's terms of service (it's equivalent to manual form filling)

Use at your own discretion. The author is not responsible for any issues arising from use of this script.

## Contributing

Contributions welcome! Please:
- Test changes thoroughly on actual Torn pages
- Maintain existing code style
- Update CLAUDE.md if changing architecture
- Verify button injection works with AJAX navigation

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify Torn's page structure hasn't changed
3. Open an issue in this repository with:
   - Browser and userscript manager versions
   - Console error messages
   - Steps to reproduce

---

Made for the Torn community 🎯
