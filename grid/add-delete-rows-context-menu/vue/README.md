# AG Grid Add/Delete Rows via Context Menu - Vue TypeScript

This demo shows how to programmatically add and delete rows in AG Grid using custom context menu actions with AG Grid Enterprise features in Vue 3 with TypeScript.

## Full Tutorial

[How To Add and Delete Rows in AG Grid from the Context Menu](https://blog.ag-grid.com/how-to-add-and-delete-rows-in-ag-grid-from-the-context-menu/)

## Features

- **Custom Context Menu**: Right-click functionality with custom menu items
- **Insert Above/Below**: Add new rows relative to the selected cell position
- **Delete Selected Rows**: Remove one or multiple selected rows
- **Dynamic Menu Labels**: Shows the count of selected rows in menu items
- **Full Row Editing**: Automatically activates editing mode for newly added rows

## Running the Demo

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── App.vue                  # Main grid component with context menu
├── assets/
│   ├── base.css            # Base styles
│   └── main.css            # Main styles
├── main.ts                  # Entry point
└── types.ts                 # TypeScript type definitions
```

## Key Technologies

- **AG Grid Vue**: Data grid component
- **AG Grid Enterprise**: Context menu and advanced features
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
