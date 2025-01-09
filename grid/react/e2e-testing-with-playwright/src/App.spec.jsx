import { test, expect } from '@playwright/experimental-ct-react';
import App from './App';

test('should render component with AG Grid', async ({ mount }) => {
    // Mount the component
    const component = await mount(<App />);

    // Verify that the AG Grid is rendered by checking for a specific element
    await expect(component.locator('.ag-root')).toBeVisible();

    // Optionally, verify that specific columns are rendered
    await expect(
        component.locator('.ag-header-cell-text').nth(0)
    ).toHaveText('Make');
    await expect(
        component.locator('.ag-header-cell-text').nth(1)
    ).toHaveText('Model');
    await expect(
        component.locator('.ag-header-cell-text').nth(2)
    ).toHaveText('Price');

    // Optionally, verify that a specific row is rendered
    await expect(component.locator('.ag-cell').nth(0)).toHaveText('Tesla');
    await expect(component.locator('.ag-cell').nth(1)).toHaveText('Model Y');
    await expect(component.locator('.ag-cell').nth(2)).toHaveText('64950');
});

test('should sort "Make" column ascending and then descending', 
    async ({ mount }) => {
        // 1. Mount the component
        const component = await mount(<App />);

        // 2. Locate the header cell with the text "Make"
        const priceHeader = 
            component.locator('.ag-header-cell-text', { hasText: 'Price' });

        // 3. Click once to sort ascending
        await priceHeader.click();

        // 4. Verify the first cell in the grid is now 'Fiat' (ascending by "price")
        const firstItem = await component
            .locator(`.ag-row[row-index="0"] [col-id="make"]`)
            .innerText();
        await expect(firstItem).toBe('Fiat');

        // 5. Click again to sort descending
        await priceHeader.click();

        // 6. Verify the first cell in the grid is now 'Tesla' 
        // (descending by "price")
        const firstItemDesc = await component
            .locator(`.ag-row[row-index="0"] [col-id="make"]`)
            .innerText();
        await expect(firstItemDesc).toBe('Tesla');
});


test('should allow editing of editable cells and update the data correctly',
    async ({ mount }) => {
        // 1. Mount the component
        const component = await mount(<App />);

        // 2. Locate the editable cell for "Price" in the first row
        const priceCell = 
            component.locator('.ag-row[row-index="0"] [col-id="price"]');

        // 3. Double-click the cell to activate edit mode
        await priceCell.dblclick();
        // Wait for the input field to appear (AG Grid renders it dynamically)
        const priceInput = priceCell.locator('input');
        await expect(priceInput).toBeVisible();
        
        // 4. Enter a new value into the input field
        const newPrice = '70000';
        await priceInput.fill(newPrice);
        // Simulate pressing Enter to save the change
        await priceInput.press('Enter');

        // 5. Verify the cell displays the updated value
        await expect(priceCell).toHaveText(newPrice);
    }
);

test('should filter data by "Make" using the column filter menu', 
    async ({ mount, page }) => {
        // 1. Mount the component
        const component = await mount(<App />);
    
        // 2. Wait for AG Grid to be fully rendered
        await page.waitForSelector('.ag-root');
    
        // 3. Locate and click the filter menu icon for the "Make" column
        const makeColumnFilterIcon = 
            component.locator('.ag-header-cell[col-id="make"] .ag-header-icon');
        await expect(makeColumnFilterIcon).toBeVisible();
        await makeColumnFilterIcon.click();
    
        // 4. Use the placeholder locator to fill in "Tesla"
        const filterInput = 
            component.locator('.ag-filter-body input[placeholder="Filter..."]');
        await filterInput.fill('Tesla');
    
        // 5. Verify only one row is visible
        const rows = component.locator('.ag-center-cols-viewport .ag-row');
        await expect(rows).toHaveCount(1);
    
        // 6. Check the cell text
        const makeCell = rows.first().locator('.ag-cell[col-id="make"]');
        await expect(makeCell).toHaveText('Tesla');
    }
);

// Test for loading data asynchronously and displaying it in the grid
test("should load data asynchronously and display it in the grid", 
    async ({ mount, page }) => {
        // 1. Mount the component
        const component = await mount(<App />);

        // 2. Check that the default AG Grid loading overlay is visible.
        //    By default, it has the class 'ag-overlay-loading-center'.
        await expect(component.locator(".ag-overlay-loading-center")).toBeVisible();

        // 3. Wait for the AG Grid root to appear - meaning data has loaded
        await expect(component.locator(".ag-root")).toBeVisible();

        // 4. Check if the first cell contains "Tesla"
        //    This confirms that row data has been rendered.
        const firstCell = component.locator(".ag-cell").first();
        await expect(firstCell).toHaveText("Tesla");
    }
);
