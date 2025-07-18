# AG Grid Add/Delete Rows with Pinned Row - Vue TypeScript

This demo shows how to implement a data entry form using AG Grid's pinned row feature in Vue 3 with TypeScript. Users can add new rows by filling in the top row.

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
│   └── SportRenderer.vue    # Custom cell renderer for sport icons
├── utils/
│   └── dateUtils.ts         # Date formatting utilities
├── types.ts                 # TypeScript type definitions
├── App.vue                  # Main grid component
├── assets/
│   └── main.css             # Grid styling
└── main.ts                  # Entry point with Font Awesome setup
```

## Key Technologies

- **AG Grid Vue**: Data grid component
- **Vue 3**: Modern progressive framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Font Awesome**: Icons for sports