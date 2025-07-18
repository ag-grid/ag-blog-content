# AG Grid Add/Delete Rows with Pinned Row - Angular TypeScript

This demo shows how to implement a data entry form using AG Grid's pinned row feature in Angular with TypeScript. Users can add new rows by filling in the top row.

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
ng serve
```

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── sport-renderer.component.ts   # Custom cell renderer for sport icons
│   ├── utils/
│   │   └── date-utils.ts                 # Date formatting utilities
│   ├── app.component.ts                  # Main grid component
│   ├── app.component.html                # Grid template
│   └── app.component.css                 # Grid styling
├── styles.css                            # Global styles
└── main.ts                               # Entry point
```

## Key Technologies

- **AG Grid Angular**: Data grid component
- **TypeScript**: Type safety
- **Angular CLI**: Development tools
- **Font Awesome**: Icons for sports
