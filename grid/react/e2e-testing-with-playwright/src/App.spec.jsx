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