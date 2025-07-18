# AG Grid Add/Delete Rows with Pinned Row - JavaScript

This demo shows how to implement a data entry form using AG Grid's pinned row feature in vanilla JavaScript. Users can add new rows by filling in the top row.

## Full Tutorial

[Add new rows using a pinned row at the top of the grid](https://blog.ag-grid.com/add-new-rows-using-a-pinned-row-at-the-top-of-the-grid/)

## Features

- **Pinned Row Input**: Top row acts as a form for adding new data
- **Auto-submission**: New rows are automatically added when all fields are complete
- **Visual Feedback**: Pending edits are highlighted with orange styling
- **Cell Flashing**: Newly added rows are flashed after being added

## Running the Demo

```bash
npm install
npm run dev
```

## Project Structure

```
├── src/
│   ├── components/
│   │   └── SportRenderer.js    # Custom cell renderer for sport icons
│   ├── utils/
│   │   └── dateUtils.js         # Date formatting utilities
│   └── main.js                  # Main grid logic
├── styles.css                   # Grid styling
└── index.html                   # Entry point
```

## Key Technologies

- **AG Grid Community**: Data grid component
- **JavaScript**: Core functionality
- **Vite**: Build tool and dev server
- **Font Awesome**: Icons for sports
