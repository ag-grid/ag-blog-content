# AG Grid Add/Delete Rows via Context Menu Demo

This demo showcases how to programmatically add and delete rows in AG Grid using custom context menu actions with AG Grid Enterprise features.

## Full Tutorial

[How To Add and Delete Rows in AG Grid from the Context Menu](blog.ag-grid.com/how-to-add-and-delete-rows-in-ag-grid-from-the-context-menu/)

## Features

- **Custom Context Menu**: Right-click functionality with custom menu items
- **Insert Above/Below**: Add new rows relative to the selected cell position
- **Delete Selected Rows**: Remove one or multiple selected rows
- **Dynamic Menu Labels**: Shows the count of selected rows in menu items
- **Full Row Editing**: Automatically activates editing mode for newly added rows

## Getting Started

Navigate to your preferred framework directory and install dependencies:

```bash
cd react # or angular, vue, js
npm install
```

## Available Frameworks

- **[React](./react/)** - TypeScript implementation with Vite
- **[Angular](./angular/)** - TypeScript implementation with Angular CLI
- **[Vue](./vue/)** - TypeScript implementation with Vite
- **[JavaScript](./js/)** - Vanilla JavaScript implementation

## Key Implementation Details

### Context Menu Configuration

The demo uses AG Grid's `getContextMenuItems` callback to provide custom menu items:

- Insert Row Above
- Insert Row Below
- Delete Selected Row(s)

### Row Manipulation

- New rows are added using the Grid API's `applyTransaction` method
- The grid automatically updates to reflect changes

## Learn More

- [AG Grid Context Menu Documentation](https://www.ag-grid.com/data-grid/context-menu/)
- [AG Grid Row Transaction API](https://www.ag-grid.com/data-grid/data-update-transactions/)
- [AG Grid Row Selection](https://www.ag-grid.com/data-grid/row-selection/)

## License

This demo requires AG Grid Enterprise features. Please refer to the [AG Grid license](https://www.ag-grid.com/license) for usage terms.
