# AG Grid Add/Delete Rows with Pinned Row - React TypeScript

This demo shows how to implement a data entry form using AG Grid's pinned row feature in React with TypeScript. Users can add new rows by filling in the top row.

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
src/
├── components/
│   └── SportRenderer.tsx    # Custom cell renderer for sport icons
├── utils/
│   └── dateUtils.ts         # Date formatting utilities
├── App.tsx                  # Main grid component
├── App.css                  # Grid styling
├── index.css                # Global styles
└── main.tsx                 # Entry point
```

## Key Technologies

- **AG Grid React**: Data grid component
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Font Awesome**: Icons for sports
