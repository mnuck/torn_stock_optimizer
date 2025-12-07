// ==UserScript==
// @name         Torn Stock Optimizer
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Optimizes company stock ordering using on-page data
// @author       Stock Optimizer
// @license      MIT; https://opensource.org/licenses/MIT
// @match        https://www.torn.com/companies.php*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    function getWarehouseCapacity() {
        const maxEl = document.querySelector('.storage-capacity .max');
        if (maxEl) {
            const capacity = parseNumber(maxEl.textContent);
            if (capacity > 0) {
                console.log(`📦 Warehouse capacity: ${capacity.toLocaleString()}`);
                return capacity;
            }
        }

        // Fallback to default if not found
        console.warn('⚠️ Could not detect warehouse capacity, using default 500,000');
        return 500000;
    }


    // Extract data from DOM
    function parseNumber(text) {
        return parseInt(text.replace(/[,\s]/g, '')) || 0;
    }

    function getOnOrderTotal(itemName) {
        const orders = document.querySelectorAll('.order-list li');
        let total = 0;

        for (const order of orders) {
            const nameEl = order.querySelector('.name');
            const statusEl = order.querySelector('.status');
            const amountEl = order.querySelector('.amount');

            if (nameEl?.textContent.trim() === itemName &&
                statusEl?.textContent.trim() !== 'Delivered' &&
                amountEl) {
                total += parseNumber(amountEl.textContent);
            }
        }

        return total;
    }

    function scrapeStockData() {
        const items = new Map();
        const stockListItems = document.querySelectorAll('.stock-list li');

        for (const li of stockListItems) {
            const nameEl = li.querySelector('.name');
            if (!nameEl) continue;

            const name = nameEl.textContent.trim();

            // Skip empty names, "Total" row, and header rows
            if (!name || name === 'Total' ||
                li.classList.contains('stock-list-title') ||
                li.classList.contains('total')) continue;

            // Extract all data from this list item
            const stockEl = li.querySelector('.stock');
            const soldEl = li.querySelector('.sold-daily');

            const inStock = stockEl
                ? parseNumber(stockEl.textContent.replace('In Stock:', '').trim())
                : 0;
            const soldAmount = soldEl
                ? parseNumber(soldEl.textContent.replace('Sold Daily:', '').trim())
                : 0;
            const onOrder = getOnOrderTotal(name);

            items.set(name, { inStock, onOrder, soldAmount });
        }

        if (items.size === 0) {
            throw new Error('No items found on page. Make sure you are on the stock ordering page.');
        }

        console.log(`✅ Scraped data for ${items.size} items`);
        return items;
    }

    // Core optimization algorithm
    function calculateStockDays(items) {
        const results = [];
        for (const [name, item] of items) {
            const totalStock = item.inStock + item.onOrder;
            const soldToday = item.soldAmount;
            const daysOfStock = soldToday === 0 ? Infinity : totalStock / soldToday;
            results.push({ name, totalStock, soldToday, daysOfStock });
        }
        return results;
    }

    function computeOptimalOrder(items, freeCapacity) {
        const orders = new Map();
        const list = [];

        for (const [name, item] of items) {
            const sold = item.soldAmount;
            if (sold === 0) continue;
            list.push({
                name: name,
                stock: item.inStock + item.onOrder,
                sold: sold
            });
        }

        if (list.length === 0 || freeCapacity <= 0) {
            return orders;
        }

        let low = 0.0;
        let high = 3650.0;

        for (let iter = 0; iter < 40; iter++) {
            const mid = (low + high) / 2;
            let needed = 0;

            for (const entry of list) {
                const targetStock = Math.ceil(entry.sold * mid);
                const add = targetStock - entry.stock;
                if (add > 0) {
                    needed += add;
                    if (needed > freeCapacity) break;
                }
            }

            if (needed > freeCapacity) {
                high = mid;
            } else {
                low = mid;
            }
        }

        const target = low;
        let remaining = freeCapacity;

        for (const entry of list) {
            const targetStock = Math.ceil(entry.sold * target);
            let add = Math.max(0, targetStock - entry.stock);
            if (add > remaining) add = remaining;
            orders.set(entry.name, add);
            remaining -= add;
        }

        if (remaining > 0 && list.length > 0) {
            list.sort((a, b) => b.sold - a.sold);
            for (const entry of list) {
                if (remaining === 0) break;
                const current = orders.get(entry.name) || 0;
                orders.set(entry.name, current + 1);
                remaining -= 1;
            }
        }

        return orders;
    }

    // Simplified field population using aria-label
    function findOrderField(itemName) {
        return document.querySelector(`input[aria-label="${itemName}"][type="text"].input-money`);
    }

    function populateOrderFields(orders) {
        let applied = 0;

        for (const [itemName, quantity] of orders) {
            const field = findOrderField(itemName);
            if (!field) continue;

            try {
                field.value = quantity;

                // Trigger change events to ensure the page recognizes the update
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));

                applied++;
            } catch (error) {
                console.error(`❌ Failed to update ${itemName}:`, error);
            }
        }

        if (applied === 0) {
            console.warn("⚠️ No order fields found for population");
            alert("No order fields found on this page. Make sure you're on the company stock ordering page.");
            return false;
        }

        console.log(`✅ Populated ${applied} order fields`);
        return true;
    }

    function displayResults(metrics, orders, freeSpace, warehouseCapacity) {
        console.log("\n=== Stock Optimization Results ===");

        const sorted = [...metrics].sort((a, b) => a.daysOfStock - b.daysOfStock);
        console.log("\n📊 Current Stock Metrics:");
        for (const metric of sorted) {
            const daysDisplay = metric.daysOfStock === Infinity ? "∞" : metric.daysOfStock.toFixed(1);
            console.log(`  ${metric.name}: ${metric.totalStock} stock, ${metric.soldToday} sold, ${daysDisplay} days`);
        }

        const totalStock = metrics.reduce((sum, m) => sum + m.totalStock, 0);
        console.log(`\n📦 Warehouse: ${totalStock.toLocaleString()}/${warehouseCapacity.toLocaleString()} (${freeSpace.toLocaleString()} free)`);

        console.log("\n✅ Recommended Orders:");
        let hasOrders = false;
        for (const [itemName, qty] of orders) {
            if (qty > 0) {
                console.log(`  ${itemName}: ${qty} units`);
                hasOrders = true;
            }
        }
        if (!hasOrders) {
            console.log("  No orders needed - all items adequately stocked");
        }
    }

    function optimizeAndFill() {
        try {
            console.log("🔄 Optimizing stock...");

            const warehouseCapacity = getWarehouseCapacity();
            const items = scrapeStockData();
            const metrics = calculateStockDays(items);
            const totalStock = metrics.reduce((sum, m) => sum + m.totalStock, 0);
            const freeSpace = Math.max(0, warehouseCapacity - totalStock);
            const orders = computeOptimalOrder(items, freeSpace);

            displayResults(metrics, orders, freeSpace, warehouseCapacity);

            // Check if there are any non-zero orders before attempting to populate
            const hasOrders = Array.from(orders.values()).some(qty => qty > 0);
            if (hasOrders) {
                populateOrderFields(orders);
            } else {
                console.log("ℹ️ No orders needed - warehouse is adequately stocked");
                alert("No orders needed - your warehouse is adequately stocked for current sales levels.");
            }

            return { items, metrics, orders, freeSpace };

        } catch (error) {
            console.error("❌ Optimization failed:", error.message);
            alert(`Optimization failed: ${error.message}`);
            throw error;
        }
    }

    // UI
    function createButton() {
        // Check if button already exists
        if (document.querySelector('#stock-optimizer-btn')) {
            return;
        }

        // Find the PLACE ORDER button wrapper
        const placeOrderWrapper = document.querySelector('span.order.btn-wrap.silver');
        if (!placeOrderWrapper) {
            return; // Silently return, we'll try again
        }

        // Create button wrapper matching Torn's style
        const wrapper = document.createElement('span');
        wrapper.className = 'btn-wrap silver';
        wrapper.style.cssText = 'margin-left: 10px;';

        const btnInner = document.createElement('span');
        btnInner.className = 'btn';

        const button = document.createElement('button');
        button.className = 'torn-btn';
        button.id = 'stock-optimizer-btn';
        button.textContent = 'OPTIMIZE';
        button.style.cssText = 'background: #9b59b6;';

        btnInner.appendChild(button);
        wrapper.appendChild(btnInner);

        // Insert right after the PLACE ORDER button
        placeOrderWrapper.parentNode.insertBefore(wrapper, placeOrderWrapper.nextSibling);

        // Button state management
        function setButtonState(state) {
            const states = {
                processing: { text: '⏳ PROCESSING...', color: '#9b59b6', disabled: true },
                success: { text: '✅ COMPLETE', color: '#28a745', disabled: true },
                error: { text: '❌ FAILED', color: '#dc3545', disabled: true }
            };

            const config = states[state];
            button.textContent = config.text;
            button.style.background = config.color;
            button.disabled = config.disabled;
        }

        function resetButton(delay) {
            setTimeout(() => {
                button.textContent = 'OPTIMIZE';
                button.style.background = '#9b59b6';
                button.disabled = false;
            }, delay);
        }

        // Add click handler
        button.addEventListener('click', (e) => {
            e.preventDefault();
            setButtonState('processing');

            try {
                optimizeAndFill();
                setButtonState('success');
                resetButton(2000);
            } catch (error) {
                setButtonState('error');
                resetButton(3000);
            }
        });
    }

    function createUI() {
        if (!window.location.href.includes('companies.php')) {
            return;
        }

        // Try to create button immediately
        createButton();

        // Watch for DOM changes (Torn uses AJAX to reload forms)
        const observer = new MutationObserver(() => {
            createButton();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also retry every 2 seconds in case mutations are missed
        setInterval(createButton, 2000);
    }

    // Global functions
    window.StockOptimizer = {
        optimizeAndFill,
        scrapeStockData,
        getWarehouseCapacity
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }

    console.log("📋 Stock Optimizer loaded");

})();
