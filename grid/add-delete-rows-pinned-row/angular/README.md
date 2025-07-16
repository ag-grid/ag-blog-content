# AG Grid Add/Delete Rows with Pinned Row - Angular

This demo shows how to implement a data entry form using AG Grid's pinned row feature in Angular with TypeScript. Users can add new rows by filling in the top row.

## Features

- **Pinned Row Input**: Top row acts as a form for adding new data
- **Auto-submission**: New rows are automatically added when all fields are complete
- **Visual Feedback**: Pending edits are highlighted with orange styling
- **Sport Icons**: Custom renderer with Font Awesome icons
- **Date Handling**: Built-in date picker with proper formatting
- **TypeScript**: Full type safety and IntelliSense support

## Running the Demo

```bash
npm install
npm start
```

The application will be available at `http://localhost:4200/`.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── sport-renderer.component.ts    # Custom cell renderer
│   ├── utils/
│   │   └── date-utils.ts                 # Date formatting utilities
│   ├── app.ts                            # Main app component
│   ├── app.html                          # App template
│   └── app.css                           # App styles
├── styles.css                            # Global styles
└── index.html                            # Entry point
```

## Key Technologies

- **Angular**: Modern web framework
- **AG Grid Angular**: Data grid component
- **TypeScript**: Type safety
- **Font Awesome**: Icons for sports

## Building

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory.
