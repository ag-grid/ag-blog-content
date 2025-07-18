# AG Grid Add/Delete Rows with Pinned Row - Angular TypeScript

This demo shows how to implement a data entry form using AG Grid's pinned row feature in Angular with TypeScript. Users can add new rows by filling in the top row.

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
│   │   └── sport-renderer.component.ts    # Custom cell renderer for sport icons
│   ├── utils/
│   │   └── date-utils.ts                 # Date formatting utilities
│   ├── app.ts                            # Main app component
│   ├── app.html                          # App template
│   └── app.css                           # App styles
├── styles.css                            # Global styles
└── index.html                            # Entry point
```

## Key Technologies

- **AG Grid Angular**: Data grid component
- **Angular**: Modern web framework
- **TypeScript**: Type safety
- **Font Awesome**: Icons for sports
