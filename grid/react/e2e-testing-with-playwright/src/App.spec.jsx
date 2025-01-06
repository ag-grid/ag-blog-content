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

test('should sort data by price when clicking on column headers', 
    async ({ mount, page }) => {
        // 1. Mount the component
        const component = await mount(<App />);
        await page.waitForSelector('.ag-header-cell-label');
    
        // 2. Click on the "Price" column header 
        // (first click for ascending order)
        const priceHeader = 
            component.locator('.ag-header-cell-text', { hasText: 'Price' });
        await expect(priceHeader).toBeVisible();
        await priceHeader.click();
    
        // 3. Determine how many rows are rendered
        const rowCount = await component.locator('.ag-row').count();
    
        // 4. Gather prices from the rendered rows
        const allPrices = [];
        for (let i = 0; i < rowCount; i++) {
            const price = await component
                .locator(`.ag-row[row-index="${i}"] [col-id="price"]`)
                .innerText();
            allPrices.push(Number(price.replace(/,/g, ''))); // Convert to number
        }
    
        // 5. Verify the ascending sort order
        const sortedAsc = [...allPrices].sort((a, b) => a - b); // Ascending sort
        expect(allPrices).toEqual(sortedAsc);
    
        // 6. Click the "Price" column header again 
        // (second click for descending order)
        await priceHeader.click();
    
        // 7. Gather prices again after sorting in descending order
        const allPricesDesc = [];
        for (let i = 0; i < rowCount; i++) {
            const price = await component
                .locator(`.ag-row[row-index="${i}"] [col-id="price"]`)
                .innerText();
            allPricesDesc.push(Number(price.replace(/,/g, ''))); // Convert to number
        }
    
        // 8. Verify the descending sort order
        const sortedDesc = [...allPrices].sort((a, b) => b - a); // Descending sort
        expect(allPricesDesc).toEqual(sortedDesc);
    }
);
  