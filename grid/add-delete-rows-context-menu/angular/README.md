# AG Grid Add/Delete Rows via Context Menu - Angular TypeScript

This demo shows how to programmatically add and delete rows in AG Grid using custom context menu actions with AG Grid Enterprise features in Angular with TypeScript.

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
├── app/
│   ├── app.component.ts     # Main grid component with context menu
│   ├── app.component.html   # Template
│   ├── app.component.css    # Styles
│   ├── app.config.ts        # Angular configuration
│   └── types.ts             # TypeScript type definitions
├── index.html               # Main HTML file
├── main.ts                  # Entry point
└── styles.css               # Global styles
```

## Key Technologies

- **AG Grid Angular**: Data grid component
- **AG Grid Enterprise**: Context menu and advanced features
- **TypeScript**: Type safety
- **Angular CLI**: Build tool and dev server
